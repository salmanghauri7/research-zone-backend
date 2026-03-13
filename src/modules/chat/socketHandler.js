/**
 * Socket.IO event handlers for the chat module
 */

import ChatServices from "./services.js";
import { ApiError } from "../../utils/apiError.js";
import NotificationServices from "../notifications/services.js";

const chatServices = new ChatServices();
const notificationServices = new NotificationServices();

const getUserId = (user = {}) => user.id?.toString() || user._id?.toString();

const getWorkspaceMemberUserIds = (workspace) => {
  const memberIds = new Set();

  if (workspace?.owner) {
    memberIds.add(workspace.owner.toString());
  }

  if (Array.isArray(workspace?.members)) {
    for (const member of workspace.members) {
      const memberId = member?.user?.toString();
      if (memberId) {
        memberIds.add(memberId);
      }
    }
  }

  return Array.from(memberIds);
};

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

/**
 * Handle join-chat-room event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing workspaceId
 */
const handleJoinChatRoom = async (socket, data) => {
  try {
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const { workspaceId } = data;
    const user = socket.user;

    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    // Validate access before allowing user to join the chat-specific room.
    await chatServices.validateWorkspaceAccess(workspaceId, user.id);

    const chatRoomName = `${workspaceId}:chat`;
    socket.join(chatRoomName);

    console.log(
      `💬 User ${user.email || user._id} joined chat room for workspace: ${workspaceId}`,
    );

    socket.to(chatRoomName).emit("user-joined-chat", {
      userId: user._id,
      email: user.email,
      workspaceId,
    });
  } catch (error) {
    console.error("Error in join-chat-room handler:", error);
    socket.emit("join-chat-room-error", {
      message: error.message || "Failed to join chat room",
      statusCode: error.statusCode || 500,
    });
  }
};

/**
 * Handle leave-chat-room event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing workspaceId
 */
const handleLeaveChatRoom = async (socket, data) => {
  try {
    if (!data) {
      return;
    }

    const { workspaceId } = data;
    const user = socket.user;

    if (!workspaceId) {
      return;
    }

    const chatRoomName = `${workspaceId}:chat`;
    socket.leave(chatRoomName);

    console.log(
      `🚪 User ${user.email || user._id} left chat room for workspace: ${workspaceId}`,
    );

    socket.to(chatRoomName).emit("user-left-chat", {
      userId: user._id,
      email: user.email,
      workspaceId,
    });
  } catch (error) {
    console.error("Error in leave-chat-room handler:", error);
  }
};

/**
 * Handle leave-workspace event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing workspaceId
 */
const handleLeaveWorkspace = async (socket, data) => {
  try {
    if (!data) {
      return;
    }

    const { workspaceId } = data;
    const user = socket.user;

    if (!workspaceId) {
      return;
    }

    socket.leave(workspaceId);
    socket.leave(`${workspaceId}:chat`);

    console.log(
      `🚪 User ${user.email || user._id} left workspace: ${workspaceId}`,
    );

    socket.to(workspaceId).emit("user-left-workspace", {
      userId: user._id,
      email: user.email,
      workspaceId,
    });
  } catch (error) {
    console.error("Error in leave-workspace handler:", error);
  }
};

/**
 * Send notifications only to workspace members who are online but not in the chat room.
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {string} workspaceId - The workspace ID
 * @param {string} senderId - Sender user ID
 * @param {Object} message - Message payload
 * @param {string} senderName - Sender display name
 * @param {Object} workspace - Workspace metadata
 */
const sendSelectiveNotifications = async (
  io,
  workspaceId,
  senderId,
  message,
  senderName,
  workspace,
) => {
  try {
    const chatRoom = io.sockets.adapter.rooms.get(`${workspaceId}:chat`);

    const workspaceMemberUserIds = getWorkspaceMemberUserIds(workspace);
    if (workspaceMemberUserIds.length === 0) {
      console.log(`⚠️ No workspace members found for workspace ${workspaceId}`);
      return;
    }

    let notificationsSent = 0;
    const senderIdStr = senderId?.toString();

    console.log(
      `📊 Workspace ${workspaceId} has ${workspaceMemberUserIds.length} total member(s)`,
    );
    if (chatRoom) {
      console.log(`📊 Chat room has ${chatRoom.size} users actively viewing`);
    }

    for (const memberUserId of workspaceMemberUserIds) {
      // Skip sender.
      if (senderIdStr && memberUserId === senderIdStr) {
        continue;
      }

      // Check if user is actively viewing this workspace chat
      let isActiveInChat = false;
      const userRoomName = `user:${memberUserId}`;
      const userRoomSockets = io.sockets.adapter.rooms.get(userRoomName);
      
      if (userRoomSockets && userRoomSockets.size > 0 && chatRoom) {
        for (const socketId of userRoomSockets) {
          if (chatRoom.has(socketId)) {
            isActiveInChat = true;
            break;
          }
        }
      }

      // If user is not actively viewing the chat, store a notification in DB
      let createdNotification = null;
      if (!isActiveInChat) {
        try {
          createdNotification = await notificationServices.createNotification({
            userId: memberUserId,
            senderId,
            workspaceId,
            messageId: message._id || message.id,
            content: message.content || "New message",
          });
        } catch (dbErr) {
          console.error("Failed to store notification in DB:", dbErr.message);
        }
      }

      if (!userRoomSockets || userRoomSockets.size === 0) {
        continue; // User is offline, we've already stored in DB, nothing to emit
      }

      // If user is online but not in the active chat room, emit the notification event
      if (!isActiveInChat) {
        for (const socketId of userRoomSockets) {
          io.to(socketId).emit("message-notified", {
            notificationId: createdNotification?._id,
            workspaceId,
            workspaceName: workspace?.title || "Workspace",
            senderName,
            messagePreview: message.content?.substring(0, 50) || "New message",
            messageId: message._id?.toString() || message.id,
            timestamp: message.createdAt || new Date(),
          });
          notificationsSent += 1;
        }
      }
    }

    console.log(
      `✅ Sent ${notificationsSent} notification(s) for workspace ${workspaceId}`,
    );
  } catch (error) {
    console.error("Error sending selective notifications:", error);
  }
};

const handleSendMessage = async (socket, data, io) => {
  try {
    // Validate request data
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const {
      workspaceId,
      content,
      attachments,
      parentMessageId,
      quotedMessageId,
    } = data;
    const user = socket.user;

    // Validate required fields
    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    // Validate workspace access
    const workspace = await chatServices.validateWorkspaceAccess(
      workspaceId,
      user.id,
    );

    // Create and save message
    let message = await chatServices.createMessage({
      workspaceId,
      sender: user.id,
      content,
      parentMessageId,
      quotedMessageId,
      attachments,
    });

    if (attachments && attachments.length > 0) {
      message = chatServices.getCloudFrontUrlsForAttachments([message])[0];
    }

    // Emit message to all users in the workspace (including sender)
    socket.to(workspaceId).emit("new-message", message);
    socket.emit("message-sent", message);

    await sendSelectiveNotifications(
      io,
      workspaceId,
      user.id,
      message,
      user.firstName || user.email,
      workspace,
    );

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

const handleEditMessage = async (socket, data) => {
  try {
    // Validate request data
    if (!data) {
      throw new ApiError("Request data is required", 400);
    }

    const { messageId, workspaceId, content } = data;
    const user = socket.user;

    // Validate required fields
    if (!messageId) {
      throw new ApiError("Message ID is required", 400);
    }

    if (!workspaceId) {
      throw new ApiError("Workspace ID is required", 400);
    }

    if (!content || content.trim() === "") {
      throw new ApiError("Message content is required", 400);
    }

    // Validate workspace access
    await chatServices.validateWorkspaceAccess(workspaceId, user.id);

    // Edit the message using service
    const updatedMessage = await chatServices.editMessage(
      messageId,
      user.id,
      content,
    );

    // Emit update event to all users in the workspace
    socket.to(workspaceId).emit("message-edited", updatedMessage);
    socket.emit("message-edit-completed", updatedMessage);

    console.log(
      `✏️ Message edited by ${user.email || user.id} in workspace: ${workspaceId}`,
    );
  } catch (error) {
    console.error("Error in editing message:", error.message);
    socket.emit("edit-message-error", {
      message: error.message || "Failed to edit message",
      statusCode: error.statusCode || 500,
    });
  }
};

/**
 * Handle typing event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing username and workspaceId
 */
const handleTyping = (socket, data) => {
  try {
    const { workspaceId, username } = data;
    const user = socket.user;

    if (!workspaceId) {
      return;
    }

    // Broadcast to all users in the workspace except the sender
    socket.to(workspaceId).emit("user_typing", {
      username: user.firstName || user.email || user._id,
      userId: user._id,
    });
  } catch (error) {
    console.error("Error in typing handler:", error.message);
  }
};

/**
 * Handle stop typing event
 * @param {Socket} socket - The socket instance
 * @param {Object} data - Event data containing username and workspaceId
 */
const handleStopTyping = (socket, data) => {
  try {
    const { workspaceId, username } = data;

    if (!workspaceId) {
      return;
    }

    // Broadcast to all users in the workspace except the sender
    socket.to(workspaceId).emit("user_stop_typing", {
      username: username || socket.user.email || socket.user._id,
      userId: socket.user._id,
    });
  } catch (error) {
    console.error("Error in stop typing handler:", error.message);
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
    const userId = getUserId(user);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    console.log(`🔌 User connected: ${socket.id} (${user.email || user._id})`);

    // Register event handlers
    socket.on("join-workspace", (data) => handleJoinWorkspace(socket, data));
    socket.on("join-chat-room", (data) => handleJoinChatRoom(socket, data));
    socket.on("leave-chat-room", (data) => handleLeaveChatRoom(socket, data));
    socket.on("leave-workspace", (data) => handleLeaveWorkspace(socket, data));
    socket.on("send-message", (data) => handleSendMessage(socket, data, io));
    socket.on("delete-message", (data) => handleDeleteMessage(socket, data));
    socket.on("edit-message", (data) => handleEditMessage(socket, data));
    socket.on("typing", (data) => handleTyping(socket, data));
    socket.on("stop_typing", (data) => handleStopTyping(socket, data));

    socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
    socket.on("error", (error) => handleError(socket, error));

    // TODO: Add more chat-specific event handlers here
    // Example events to implement later:
    // - leave-workspace: Leave a workspace room
  });
};
