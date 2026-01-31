/**
 * Socket.IO event handlers for the chat module
 */

/**
 * Register socket event handlers
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 */
export const registerChatHandlers = (io) => {
  io.on("connection", (socket) => {
    // socket.user is attached by socketAuthMiddleware
    const user = socket.user;
    console.log(`🔌 User connected: ${socket.id} (${user.email || user._id})`);

    // Handle user disconnection
    socket.on("disconnect", (reason) => {
      console.log(`❌ User disconnected: ${socket.id} (${user.email || user._id}) - Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`⚠️ Socket error for ${socket.id}:`, error);
    });

    // TODO: Add more chat-specific event handlers here
    // Example events to implement later:
    // - join-workspace: Join a workspace room
    // - leave-workspace: Leave a workspace room
    // - send-message: Send a message to a workspace
    // - typing: Broadcast typing indicator
  });
};
