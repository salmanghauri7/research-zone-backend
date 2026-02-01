import mongoose from "mongoose";
import Workspace from "../workspaces/model.js";
import { ApiError } from "../../utils/apiError.js";

export default class ChatServices {
  /**
   * Validate and check if user can join a workspace
   * @param {string} workspaceId - The workspace ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Workspace object if valid
   * @throws {ApiError} If validation fails
   */
  async validateWorkspaceAccess(workspaceId, userId) {
    // Validate workspaceId format
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError("Invalid workspace ID", 400);
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError("Workspace not found", 404);
    }

    // Check if user is a member or owner of the workspace
    const isMember =
      workspace.owner.toString() === userId.toString() ||
      workspace.members.some(
        (member) => member.user.toString() === userId.toString(),
      );

    if (!isMember) {
      throw new ApiError("You are not a member of this workspace", 403);
    }

    return workspace;
  }

  /**
   * Get workspace details for socket response
   * @param {Object} workspace - The workspace document
   * @returns {Object} Formatted workspace data
   */
  formatWorkspaceData(workspace) {
    return {
      _id: workspace._id,
      title: workspace.title,
      color: workspace.color,
      memberCount: workspace.members.length,
    };
  }
}
