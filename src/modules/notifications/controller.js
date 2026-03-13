import NotificationServices from "./services.js";
import ApiResponse from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

const notificationServices = new NotificationServices();

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 50, isRead } = req.query;

    const result = await notificationServices.getNotifications(
      userId,
      parseInt(page),
      parseInt(limit),
      isRead
    );

    return ApiResponse.success(
      res,
      "Notifications fetched successfully",
      200,
      result
    );
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id: notificationId } = req.params;

    const notification = await notificationServices.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      throw new ApiError("Notification not found", 404);
    }

    // Optional: emit socket event backwards if req.app.get("io") is set
    const io = req.app.get("io");
    if (io && notification.senderId) {
      // Assuming 'user:userId' room format for real-time delivery
      const senderRoom = `user:${notification.senderId._id.toString()}`;
      io.to(senderRoom).emit("notification-read", {
        notificationId: notification._id,
        readBy: userId,
        workspaceId: notification.workspaceId._id,
      });
    }

    return ApiResponse.success(
      res,
      "Notification marked as read",
      200,
      notification
    );
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id: notificationId } = req.params;

    const result = await notificationServices.deleteNotification(
      notificationId,
      userId
    );

    if (!result) {
      throw new ApiError("Notification not found", 404);
    }

    return ApiResponse.success(
      res,
      "Notification deleted successfully",
      200,
      { id: notificationId }
    );
  } catch (error) {
    next(error);
  }
};
