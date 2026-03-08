import mongoose from "mongoose";
import BaseRepository from "../../../utils/baseRepository.js";
import { ApiError } from "../../../utils/apiError.js";
import { errorMessages } from "../../../constants/messages.js";
import Workspace from "../model.js";
import SavedPaper from "../saved-papers/model.js";
import { returnFoldersAndPapersPipeline } from "../../../aggregations/saved-papers/pipelines.js";

export default class FolderServices extends BaseRepository {
  constructor(model) {
    super(model);
  }

  /**
   * Create a new folder in a workspace
   * @param {Object} data - { name, workspaceId, parentFolderId, userId }
   * @returns {Promise<Object>} Created folder
   */
  async createFolder({ name, workspaceId, parentFolderId = null, userId }) {
    // Validate workspace exists and user has access
    await this.validateWorkspaceAccess(workspaceId, userId);

    // If parentFolderId is provided, validate it exists and belongs to the same workspace
    if (parentFolderId) {
      await this.validateParentFolder(parentFolderId, workspaceId);
    }

    // Check if folder with same name exists in the same parent
    const existingFolder = await this.findOne({
      workspaceId,
      name,
      parentFolderId: parentFolderId || null,
    });

    if (existingFolder) {
      throw new ApiError(errorMessages.FOLDER.ALREADY_EXISTS, 400);
    }

    const folder = await this.create({
      name,
      workspaceId,
      parentFolderId,
    });

    return folder;
  }

  /**
   * Get folder by ID with validation
   * @param {string} folderId - Folder ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Folder document
   */

  /**
   * Get folder tree structure
   * @param {string} workspaceId - Workspace ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Hierarchical folder structure
   */
  async getFolderTree(workspaceId, userId) {
    // Validate workspace access
    await this.validateWorkspaceAccess(workspaceId, userId);

    const folders = await this.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    });

    // Build tree structure
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create map of all folders
    folders.forEach((folder) => {
      folderMap.set(folder._id.toString(), {
        ...folder.toObject(),
        children: [],
      });
    });

    // Second pass: build tree
    folders.forEach((folder) => {
      const folderObj = folderMap.get(folder._id.toString());
      if (folder.parentFolderId) {
        const parent = folderMap.get(folder.parentFolderId.toString());
        if (parent) {
          parent.children.push(folderObj);
        }
      } else {
        rootFolders.push(folderObj);
      }
    });

    return rootFolders;
  }

  /**
   * Update folder name
   * @param {string} folderId - Folder ID
   * @param {string} name - New folder name
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated folder
   */
  async updateFolder(folderId, name, userId) {
    const folder = await this.findById(folderId);

    if (!folder) {
      throw new ApiError(errorMessages.FOLDER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(folder.workspaceId.toString(), userId);

    // Check if another folder with the same name exists in the same parent
    const existingFolder = await this.findOne({
      workspaceId: folder.workspaceId,
      name,
      parentFolderId: folder.parentFolderId || null,
      _id: { $ne: folderId },
    });

    if (existingFolder) {
      throw new ApiError(errorMessages.FOLDER.ALREADY_EXISTS, 400);
    }

    const updatedFolder = await this.updateById(folderId, { name });
    return updatedFolder;
  }

  /**
   * Delete folder and optionally its children
   * @param {string} folderId - Folder ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFolder(folderId, userId) {
    const folder = await this.findById(folderId);

    if (!folder) {
      throw new ApiError(errorMessages.FOLDER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(folder.workspaceId.toString(), userId);

    // Check if folder has children
    const childFolders = await this.find({
      parentFolderId: new mongoose.Types.ObjectId(folderId),
    });

    if (childFolders.length > 0) {
      throw new ApiError(errorMessages.FOLDER.HAS_CHILDREN, 400);
    }

    // Delete the folder
    await this.deleteOne({ _id: folderId });

    return { deleted: true, folderId };
  }

  /**
   * Delete folder and all its children recursively
   * @param {string} folderId - Folder ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFolderRecursive(folderId, userId) {
    const folder = await this.findById(folderId);

    if (!folder) {
      throw new ApiError(errorMessages.FOLDER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(folder.workspaceId.toString(), userId);

    // Get all children folders recursively
    const folderIds = await this.getAllChildFolderIds(folderId);
    folderIds.push(new mongoose.Types.ObjectId(folderId));

    // Delete all saved papers in these folders
    const papersResult = await SavedPaper.deleteMany({
      folderId: { $in: folderIds },
    });

    // Delete all folders
    const foldersResult = await this.model.deleteMany({
      _id: { $in: folderIds },
    });

    return {
      deleted: true,
      folderId,
      foldersDeleted: foldersResult.deletedCount,
      papersDeleted: papersResult.deletedCount,
    };
  }

  /**
   * Get all child folder IDs recursively
   * @param {string} parentFolderId - Parent folder ID
   * @returns {Promise<Array>} Array of folder IDs
   */
  async getAllChildFolderIds(parentFolderId) {
    const children = await this.find({
      parentFolderId: new mongoose.Types.ObjectId(parentFolderId),
    });

    let allIds = children.map((child) => child._id);

    for (const child of children) {
      const childIds = await this.getAllChildFolderIds(child._id.toString());
      allIds = allIds.concat(childIds);
    }

    return allIds;
  }

  /**
   * Validate workspace exists and user has access to it
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
   * Validate parent folder exists and belongs to the same workspace
   * @param {string} parentFolderId - Parent folder ID
   * @param {string} workspaceId - Workspace ID
   * @throws {ApiError} If parent folder not found or belongs to different workspace
   */
  async validateParentFolder(parentFolderId, workspaceId) {
    const parentFolder = await this.findById(parentFolderId);

    if (!parentFolder) {
      throw new ApiError(errorMessages.FOLDER.PARENT_NOT_FOUND, 404);
    }

    if (parentFolder.workspaceId.toString() !== workspaceId.toString()) {
      throw new ApiError(errorMessages.FOLDER.PARENT_WORKSPACE_MISMATCH, 400);
    }

    return parentFolder;
  }

  async getPapersAndFolders(workspaceId, userId, folderId = null) {
    // Validate workspace access
    await this.validateWorkspaceAccess(workspaceId, userId);

    const pipeline = returnFoldersAndPapersPipeline(workspaceId, folderId);

    const result = await this.aggregate(pipeline);
    return result;
  }

  /**
   * Get folder path from root to current folder
   * @param {string} folderId - Folder ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of folders from root to current folder
   */
  async getFolderPath(folderId, userId) {
    const folder = await this.findById(folderId);

    if (!folder) {
      throw new ApiError(errorMessages.FOLDER.NOT_FOUND, 404);
    }

    // Validate workspace access
    await this.validateWorkspaceAccess(folder.workspaceId.toString(), userId);

    const path = [];
    let currentFolder = folder;

    // Traverse up the parent chain
    while (currentFolder) {
      path.unshift({
        id: currentFolder._id.toString(),
        name: currentFolder.name,
      });

      if (currentFolder.parentFolderId) {
        currentFolder = await this.findById(
          currentFolder.parentFolderId.toString(),
        );
      } else {
        currentFolder = null;
      }
    }

    return path;
  }
}
