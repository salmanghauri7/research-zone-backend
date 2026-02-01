/**
 * Socket.IO event handlers for the chat module
 */

import ChatServices from "./services.js";

const chatServices = new ChatServices();

/**
 * Handle join-workspace event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing workspaceId
 */
const handleJoinWorkspace = async (socket, data) => {
  try {
    const { workspaceId } = data;
    const user = socket.user;

    // Validate workspace access using service
    const workspace = await chatServices.validateWorkspaceAccess(
      workspaceId,
      user._id,
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
    socket.emit("error", {
      event: "join-workspace",
      message: error.message || "Failed to join workspace",
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

    socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
    socket.on("error", (error) => handleError(socket, error));

    // TODO: Add more chat-specific event handlers here
    // Example events to implement later:
    // - leave-workspace: Leave a workspace room
    // - send-message: Send a message to a workspace
    // - typing: Broadcast typing indicator
  });
};
