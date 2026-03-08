import mongoose from "mongoose";
import BaseRepository from "../../../utils/baseRepository.js";
import { ApiError } from "../../../utils/apiError.js";
import { errorMessages } from "../../../constants/messages.js";
import Workspace from "../model.js";
import Folder from "../folders/model.js";
import { buildPapersCountByFolderPipeline } from "../../../aggregations/saved-papers/pipelines.js";

export default class SavedPaperServices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  /**
   * Save a paper to workspace
   * @param {Object} data - Paper data including workspaceId, userId, folderId, title, link, etc.
   * @returns {Promise<Object>} Saved paper
   */
  async savePaper(data) {
    const {
      workspaceId,
      userId,
      folderId,
      title,
      link,
      authors,
      published,

    } = data;

    // Validate workspace access
    await this.validateWorkspaceAccess(workspaceId, userId);

    // If folderId is provided, validate it
    if (folderId) {
      await this.validateFolder(folderId, workspaceId);
    }

    // Check if paper already exists in the workspace (by link)
    const existingPaper = await this.findOne({
      workspaceId,
      link,
    });

    if (existingPaper) {
      throw new ApiError(errorMessages.SAVED_PAPER.ALREADY_EXISTS, 400);
    }

    const savedPaper = await this.create({
      workspaceId,
      userId,
      folderId: folderId || null,
      title,
      link,
      authors: authors || "",
      published: published || "",
    });

    return savedPaper;
  }


  /**
   * Move paper to different folder
   * @param {string} paperId - Paper ID
   * @param {string|null} folderId - Target folder ID (null for root)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated paper
   */
  async movePaper(paperId, folderId, userId) {
    const paper = await this.findById(paperId);

    if (!paper) {
      throw new ApiError(errorMessages.SAVED_PAPER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(paper.workspaceId.toString(), userId);

    // If moving to a folder, validate it
    if (folderId && folderId !== "root") {
      await this.validateFolder(folderId, paper.workspaceId.toString());
    }

    const updatedPaper = await this.updateById(paperId, {
      folderId: folderId === "root" ? null : folderId,
    });

    return updatedPaper;
  }

  /**
   * Delete a saved paper
   * @param {string} paperId - Paper ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSavedPaper(paperId, userId) {
    const paper = await this.findById(paperId);

    if (!paper) {
      throw new ApiError(errorMessages.SAVED_PAPER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(paper.workspaceId.toString(), userId);

    // Only the user who saved it or workspace owner can delete
    const workspace = await Workspace.findById(paper.workspaceId);
    const isOwner = workspace.owner.toString() === userId.toString();
    const isPaperOwner = paper.userId.toString() === userId.toString();

    if (!isOwner && !isPaperOwner) {
      throw new ApiError(errorMessages.SAVED_PAPER.DELETE_NOT_AUTHORIZED, 403);
    }

    await this.deleteOne({ _id: paperId });

    return { deleted: true, paperId };
  }

 

  /**
   * Validate workspace exists and user has access
   * @param {string} workspaceId - Workspace ID
   * @param {string} userId - User ID
   * @throws {ApiError} If workspace not found or user has no access
   */
  async validateWorkspaceAccess(workspaceId, userId) {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_FOUND, 404);
    }

    // Check if user is owner or member
    const isOwner = workspace.owner.toString() === userId.toString();
    const isMember = workspace.members.some(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!isOwner && !isMember) {
      throw new ApiError(errorMessages.WORKSPACE.NOT_MEMBER, 403);
    }

    return workspace;
  }

  /**
   * Validate folder exists and belongs to the workspace
   * @param {string} folderId - Folder ID
   * @param {string} workspaceId - Workspace ID
   * @throws {ApiError} If folder not found or belongs to different workspace
   */
  async validateFolder(folderId, workspaceId) {
    const folder = await Folder.findById(folderId);

    if (!folder) {
      throw new ApiError(errorMessages.FOLDER.NOT_FOUND, 404);
    }

    if (folder.workspaceId.toString() !== workspaceId.toString()) {
      throw new ApiError(errorMessages.FOLDER.PARENT_WORKSPACE_MISMATCH, 400);
    }

    return folder;
  }
}
