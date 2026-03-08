import { errorMessages, successMessages } from "../../../constants/messages.js";
import { ApiError } from "../../../utils/apiError.js";
import apiResponse from "../../../utils/apiResponse.js";
import Folder from "./model.js";
import FolderServices from "./services.js";

const folderDb = new FolderServices(Folder);

export default class FolderController {
  /**
   * Create a new folder
   * @route POST /api/folders
   */
  static async createFolder(req, res) {
    try {
      const { name, workspaceId, parentFolderId } = req.body;
      const user = req.user;

      if (!name || !name.trim()) {
        throw new ApiError(errorMessages.FOLDER.NAME_REQUIRED, 400);
      }

      if (!workspaceId) {
        throw new ApiError(errorMessages.FOLDER.WORKSPACE_ID_REQUIRED, 400);
      }

      const folder = await folderDb.createFolder({
        name: name.trim(),
        workspaceId,
        parentFolderId: parentFolderId || null,
        userId: user.id,
      });

      return apiResponse.success(
        res,
        successMessages.FOLDER.CREATE_SUCCESS,
        201,
        folder,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.CREATE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Get folders by workspace
   * @route GET /api/folders/workspace/:workspaceId
   */

  /**
   * Get folder by ID
   * @route GET /api/folders/:folderId
   */

  /**
   * Get folder tree structure
   * @route GET /api/folders/workspace/:workspaceId/tree
   */
  static async getFolderTree(req, res) {
    try {
      const { workspaceId } = req.params;
      const user = req.user;

      if (!workspaceId) {
        throw new ApiError(errorMessages.FOLDER.WORKSPACE_ID_REQUIRED, 400);
      }

      const tree = await folderDb.getFolderTree(workspaceId, user.id);

      return apiResponse.success(
        res,
        successMessages.FOLDER.GET_TREE_SUCCESS,
        200,
        tree,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.GET_TREE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Update folder
   * @route PUT /api/folders/:folderId
   */
  static async updateFolder(req, res) {
    try {
      const { folderId } = req.params;
      const { name } = req.body;
      const user = req.user;

      if (!folderId) {
        throw new ApiError(errorMessages.FOLDER.ID_REQUIRED, 400);
      }

      if (!name || !name.trim()) {
        throw new ApiError(errorMessages.FOLDER.NAME_REQUIRED, 400);
      }

      const folder = await folderDb.updateFolder(
        folderId,
        name.trim(),
        user.id,
      );

      return apiResponse.success(
        res,
        successMessages.FOLDER.UPDATE_SUCCESS,
        200,
        folder,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.UPDATE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Delete folder (non-recursive)
   * @route DELETE /api/folders/:folderId
   */
  static async deleteFolder(req, res) {
    try {
      const { folderId } = req.params;
      const user = req.user;

      if (!folderId) {
        throw new ApiError(errorMessages.FOLDER.ID_REQUIRED, 400);
      }

      const result = await folderDb.deleteFolder(folderId, user.id);

      return apiResponse.success(
        res,
        successMessages.FOLDER.DELETE_SUCCESS,
        200,
        result,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.DELETE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Delete folder and all children recursively
   * @route DELETE /api/folders/:folderId/recursive
   */
  static async deleteFolderRecursive(req, res) {
    try {
      const { folderId } = req.params;
      const user = req.user;

      if (!folderId) {
        throw new ApiError(errorMessages.FOLDER.ID_REQUIRED, 400);
      }

      const result = await folderDb.deleteFolderRecursive(folderId, user.id);

      return apiResponse.success(
        res,
        successMessages.FOLDER.DELETE_RECURSIVE_SUCCESS,
        200,
        result,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.DELETE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   *
   * @routes GET /api/folders/workspace/:workspaceId?folderId=XXX
   */
  static async getPapersAndFolders(req, res) {
    try {
      const { workspaceId } = req.params;
      const folderId = req.query.folderId || null;
      const user = req.user;

      if (!workspaceId) {
        throw new ApiError(errorMessages.FOLDER.WORKSPACE_ID_REQUIRED, 400);
      }

      const data = await folderDb.getPapersAndFolders(
        workspaceId,
        user.id,
        folderId,
      );
      return apiResponse.success(
        res,
        successMessages.FOLDER.GET_SUCCESS,
        200,
        data,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.GET_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Get folder path from root to current folder
   * @route GET /api/folders/:folderId/path
   */
  static async getFolderPath(req, res) {
    try {
      const { folderId } = req.params;
      const user = req.user;

      if (!folderId) {
        throw new ApiError(errorMessages.FOLDER.ID_REQUIRED, 400);
      }

      const path = await folderDb.getFolderPath(folderId, user.id);

      return apiResponse.success(
        res,
        successMessages.FOLDER.GET_PATH_SUCCESS,
        200,
        path,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.FOLDER.GET_PATH_FAILED,
        err.statusCode || 500,
      );
    }
  }
}
