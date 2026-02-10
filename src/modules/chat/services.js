import mongoose from "mongoose";
import Workspace from "../workspaces/model.js";
import Message from "./model.js";
import { ApiError } from "../../utils/apiError.js";
import BaseRepository from "../../utils/baseRepository.js";


export default class ChatServices extends BaseRepository {
  constructor(model) {
    super(model);
  }
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
      workspace.owner?.toString() === userId.toString() ||
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

  /**
   * Create and save a new message
   * @param {Object} messageData - Message data
   * @param {string} messageData.workspaceId - The workspace ID
   * @param {string} messageData.sender - The sender user ID
   * @param {string} messageData.content - Message content
   * @param {string} [messageData.parentMessageId] - Parent message ID for threads
   * @param {string} [messageData.quotedMessageId] - Quoted message ID for replies
   * @returns {Promise<Object>} Created message populated with sender info
   * @throws {ApiError} If validation fails
   */
  async createMessage(messageData) {
    const { workspaceId, sender, content, parentMessageId, quotedMessageId } =
      messageData;

    // Validate parentMessageId if provided
    if (parentMessageId && !mongoose.Types.ObjectId.isValid(parentMessageId)) {
      throw new ApiError("Invalid parent message ID", 400);
    }

    // Validate quotedMessageId if provided
    if (quotedMessageId && !mongoose.Types.ObjectId.isValid(quotedMessageId)) {
      throw new ApiError("Invalid quoted message ID", 400);
    }

    // Create message
    const message = new Message({
      workspaceId,
      sender,
      content,
      parentMessageId: parentMessageId || null,
      quotedMessageId: quotedMessageId || null,
    });

    await message.save();

    // If it's a threaded reply, increment parent's reply count
    if (parentMessageId) {
      await Message.findByIdAndUpdate(parentMessageId, {
        $inc: { replyCount: 1 },
      });
    }

    // Populate sender information before returning
    await message.populate("sender", "firstName username email");

    return message;
  }

  /**
   * Get messages with cursor-based pagination
   * @param {string} workspaceId - The workspace ID
   * @param {number} limit - Number of messages to fetch
   * @param {string} [cursor] - Cursor for pagination (last message ID)
   * @returns {Promise<Object[]>} Array of messages with sender info
   */
  async getMessagesbyPagination(workspaceId, limit, cursor){
    const query = {workspaceId: workspaceId};
    if(cursor){
      query._id = {$lt: cursor};
    }

    const messages = await this.model
      .find(query)
      .sort({ _id: -1 }) // Sort by ID descending (newest first)
      .limit(limit);
    const nextCursor = messages.length > 0 ? messages[messages.length - 1]._id : null;
    return {messages, nextCursor};
  }
}
