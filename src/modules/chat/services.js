import mongoose from "mongoose";
import Workspace from "../workspaces/model.js";
import Message from "./model.js";
import { ApiError } from "../../utils/apiError.js";
import BaseRepository from "../../utils/baseRepository.js";
import { generateCloudFrontUrl } from "../../utils/cloudFrontSigner.js";

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
      console.error(parentMessageId);
      throw new ApiError("Invalid parent message ID", 400);
    }

    // Validate quotedMessageId if provided
    if (quotedMessageId && !mongoose.Types.ObjectId.isValid(quotedMessageId)) {
      throw new ApiError("Invalid quoted message ID", 400);
    }

    // If parentMessageId is provided, validate it exists and belongs to same workspace
    if (parentMessageId) {
      const parentMessage = await Message.findById(parentMessageId);

      if (!parentMessage) {
        throw new ApiError("Parent message not found", 404);
      }

      if (parentMessage.workspaceId.toString() !== workspaceId.toString()) {
        throw new ApiError(
          "Parent message belongs to a different workspace",
          400,
        );
      }

      // Ensure we're not trying to reply to a deleted message
      if (parentMessage.isDeleted) {
        throw new ApiError("Cannot reply to a deleted message", 400);
      }
    }

    // Validate quotedMessageId if provided
    if (quotedMessageId) {
      const quotedMessage = await Message.findById(quotedMessageId);

      if (!quotedMessage) {
        throw new ApiError("Quoted message not found", 404);
      }

      if (quotedMessage.workspaceId.toString() !== workspaceId.toString()) {
        throw new ApiError(
          "Quoted message belongs to a different workspace",
          400,
        );
      }
    }

    // Create the message - ensure this completes
    const message = await Message.create({
      workspaceId,
      sender,
      content,
      parentMessageId: parentMessageId || null,
      quotedMessageId: quotedMessageId || null,
      attachments: messageData.attachments,
    });

    // If it's a threaded reply, increment parent's reply count
    if (parentMessageId) {
      const updateResult = await Message.findByIdAndUpdate(
        parentMessageId,
        { $inc: { replyCount: 1 } },
        { new: true },
      );

      // This should never happen since we validated above, but adding as safeguard
      if (!updateResult) {
        console.error(
          `Failed to increment reply count for parent message: ${parentMessageId}`,
        );
      }
    }

    // Populate sender information before returning
    await message.populate("sender", "firstName");

    return message;
  }

  /**
   * Get messages with cursor-based pagination
   * @param {string} workspaceId - The workspace ID
   * @param {number} limit - Number of messages to fetch
   * @param {string} [cursor] - Cursor for pagination (last message ID)
   * @returns {Promise<Object[]>} Array of messages with sender info
   */
  async getMessagesbyPagination(workspaceId, limit, cursor) {
    const query = { workspaceId: workspaceId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await this.model
      .find(query)
      .populate("sender", "firstName")
      .sort({ _id: -1 }) // Sort by ID descending (newest first)
      .limit(limit);
    const nextCursor =
      messages.length > 0 ? messages[messages.length - 1]._id : null;
    return { messages, nextCursor };
  }

  /**
   * Soft delete a message and handle cascade deletion for thread replies
   * @param {string} messageId - The message ID to delete
   * @param {string} userId - The user ID requesting deletion
   * @returns {Promise<Object>} Deletion result
   * @throws {ApiError} If validation fails
   */
  async deleteMessage(messageId, userId) {
    // Validate messageId format
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError("Invalid message ID", 400);
    }

    // Fetch the message
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      throw new ApiError("Message is already deleted", 400);
    }

    // Check if user is the sender (permission check)
    if (message.sender.toString() !== userId.toString()) {
      throw new ApiError(
        "You do not have permission to delete this message",
        403,
      );
    }

    // Soft delete: Clear content and attachments, set isDeleted flag
    message.content = "";
    message.attachments = [];
    message.isDeleted = true;
    await message.save();

    // Check if this message has a parentMessageId (it's a thread reply)
    if (message.parentMessageId) {
      // This is a thread reply - decrement parent's reply count
      await Message.findByIdAndUpdate(message.parentMessageId, {
        $inc: { replyCount: -1 },
      });

      return {
        deletedMessageId: messageId,
        isThreadReply: true,
        parentMessageId: message.parentMessageId,
      };
    } else {
      // This is a main message - check for thread replies
      const threadReplies = await Message.find({
        parentMessageId: messageId,
      });

      // Permanently delete all thread replies (hard delete)
      if (threadReplies.length > 0) {
        await Message.deleteMany({ parentMessageId: messageId });
      }

      return {
        deletedMessageId: messageId,
        isThreadReply: false,
        deletedRepliesCount: threadReplies.length,
        deletedReplyIds: threadReplies.map((reply) => reply._id),
      };
    }
  }

  /**
   * Edit a message
   * @param {string} messageId - The message ID to edit
   * @param {string} userId - The user ID requesting edit
   * @param {string} content - The new content
   * @returns {Promise<Object>} Updated message
   * @throws {ApiError} If validation fails
   */
  async editMessage(messageId, userId, content) {
    // Validate messageId format
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError("Invalid message ID", 400);
    }

    // Validate content
    if (!content || content.trim() === "") {
      throw new ApiError("Message content is required", 400);
    }

    // Fetch the message
    const message = await Message.findById(messageId);
    if (!message) {
      throw new ApiError("Message not found", 404);
    }

    // Check if user is the sender (permission check)
    if (message.sender.toString() !== userId.toString()) {
      throw new ApiError(
        "You do not have permission to edit this message",
        403,
      );
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      throw new ApiError("Cannot edit a deleted message", 400);
    }

    // Update the message
    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    // Populate sender information before returning
    await message.populate("sender", "firstName");

    return message;
  }

  /**
   * Delete all messages in a workspace (for testing purposes)
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<number>} Number of deleted messages
   * @throws {ApiError} If validation fails
   */
  async deleteAllMessagesByWorkspace(workspaceId) {
    // Validate workspaceId format
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError("Invalid workspace ID", 400);
    }

    // Delete all messages for the workspace
    const result = await Message.deleteMany({ workspaceId: workspaceId });

    return result.deletedCount;
  }

  generateCloudFrontUrlForFile(fileKey) {
    // Validate fileKey exists
    if (!fileKey || typeof fileKey !== 'string' || fileKey.trim() === '') {
      throw new ApiError('Invalid or missing fileKey', 400);
    }

    return generateCloudFrontUrl(fileKey);
  }

  getCloudFrontUrlsForAttachments(messages) {
    const messagesWithUrls = messages.map((msg) => {
      const plainMsg = msg.toObject();

      if (plainMsg.attachments && plainMsg.attachments.length > 0) {
        // Filter out attachments without fileKey and generate URLs for valid ones
        const validAttachments = plainMsg.attachments.filter(
          (attachment) => attachment.fileKey && attachment.fileKey.trim() !== ''
        );

        plainMsg.attachments = validAttachments.map((attachment) => ({
          ...attachment,
          url: this.generateCloudFrontUrlForFile(attachment.fileKey),
        }));
      }
      return plainMsg;
    });

    return messagesWithUrls;
  }
}
