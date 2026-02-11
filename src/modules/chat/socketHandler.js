/**
 * Socket.IO event handlers for the chat module
 */

import ChatServices from "./services.js";
import { ApiError } from "../../utils/apiError.js";

const chatServices = new ChatServices();

/**
 * Handle join-workspace event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing workspaceId
 */
const handleJoinWorkspace = async (socket, data) => {
  try {
    // Validate request data
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const { workspaceId } = data;
    const user = socket.user;

    // Validate required fields
    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    // Validate workspace access using service
    const workspace = await chatServices.validateWorkspaceAccess(
      workspaceId,
      user.id,
    );

    // Join the workspace room
    socket.join(workspaceId);
    console.log(
      `✅ User ${user.email || user._id} joined workspace: ${workspaceId}`,
    );

    // Get formatted workspace data
    const workspaceData = chatServices.formatWorkspaceData(workspace);

    // Notify the user that they successfully joined
    socket.emit("joined-workspace", {
      workspaceId,
      workspace: workspaceData,
    });

    // Notify other members in the workspace that this user joined
    socket.to(workspaceId).emit("user-joined-workspace", {
      userId: user._id,
      email: user.email,
      workspaceId,
    });
  } catch (error) {
    console.error("Error in join-workspace handler:", error);
    socket.emit("join-workspace-error", {
      message: error.message || "Failed to join workspace",
      statusCode: error.statusCode || 500,
    });
  }
};

const handleSendMessage = async (socket, data) => {
  try {
    // Validate request data
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const { workspaceId, content, parentMessageId, quotedMessageId } = data;
    const user = socket.user;

    // Validate required fields
    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    if (!content || content.trim() === "") {
      throw new ApiError("Message content is required", 400);
    }

    // Validate workspace access
    await chatServices.validateWorkspaceAccess(workspaceId, user.id);

    // Create and save message
    const message = await chatServices.createMessage({
      workspaceId,
      sender: user.id,
      content,
      parentMessageId,
      quotedMessageId,
    });

    // Emit message to all users in the workspace (including sender)
    socket.to(workspaceId).emit("new-message", message);
    socket.emit("message-sent", message);

    console.log(
      `📨 Message sent by ${user.email || user.id} in workspace: ${workspaceId}`,
    );
  } catch (error) {
    console.error("Error in sending message:", error.message);
    socket.emit("send-message-error", {
      message: error.message || "Failed to send message",
      statusCode: error.statusCode || 500,
    });
  }
};

const handleDeleteMessage = async (socket, data) => {
  try {
    // Validate request data
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const { messageId, workspaceId } = data;
    const user = socket.user;

    // Validate required fields
    if (!messageId) {
      throw new ApiError("Message ID is required", 400);
    }

    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    // Validate workspace access
    await chatServices.validateWorkspaceAccess(workspaceId, user.id);

    // Delete the message using service
    const result = await chatServices.deleteMessage(messageId, user.id);

    // Emit deletion event to all users in the workspace
    socket.to(workspaceId).emit("message-deleted", result);
    socket.emit("message-deletion-completed", result);

    console.log(
      `🗑️ Message deleted by ${user.email || user.id} in workspace: ${workspaceId}`,
    );
  } catch (error) {
    console.error("Error in deleting message:", error.message);
    socket.emit("delete-message-error", {
      message: error.message || "Failed to delete message",
      statusCode: error.statusCode || 500,
    });
  }
};

/**
 * Handle user disconnect event
 * @param {Socket} socket - The socket instance
 * @param {string} reason - Disconnect reason
 */
const handleDisconnect = (socket, reason) => {
  const user = socket.user;
  console.log(
    `❌ User disconnected: ${socket.id} (${user.email || user._id}) - Reason: ${reason}`,
  );
};

/**
 * Handle socket errors
 * @param {Socket} socket - The socket instance
 * @param {Error} error - The error object
 */
const handleError = (socket, error) => {
  console.error(`⚠️ Socket error for ${socket.id}:`, error);
};

/**
 * Register socket event handlers
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
export const registerChatHandlers = (io) => {
  io.on("connection", (socket) => {
    // socket.user is attached by socketAuthMiddleware
    const user = socket.user;
    console.log(`🔌 User connected: ${socket.id} (${user.email || user._id})`);

    // Register event handlers
    socket.on("join-workspace", (data) => handleJoinWorkspace(socket, data));
    socket.on("send-message", (data) => handleSendMessage(socket, data));

    socket.on("delete-message", (data) => handleDeleteMessage(socket, data));

    socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
    socket.on("error", (error) => handleError(socket, error));

    // TODO: Add more chat-specific event handlers here
    // Example events to implement later:
    // - leave-workspace: Leave a workspace room
    // - send-message: Send a message to a workspace
    // - typing: Broadcast typing indicator
  });
};
