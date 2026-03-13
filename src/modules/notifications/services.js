import Notification from "./model.js";

class NotificationServices {
  /**
   * Create a new notification
   */
  async createNotification(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification.populate([
      { path: "senderId", select: "firstName lastName email avatar" },
      { path: "workspaceId", select: "title" },
    ]);
  }

  /**
   * Get notifications for a user with pagination and optional isRead filter
   */
  async getNotifications(userId, page = 1, limit = 50, isRead = null) {
    const query = { userId };
    
    if (isRead !== null && isRead !== undefined) {
      // Support string 'true' / 'false' from query params
      query.isRead = isRead === "true" || isRead === true;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate("senderId", "firstName lastName email avatar")
      .populate("workspaceId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    )
      .populate("senderId", "firstName lastName email avatar")
      .populate("workspaceId", "title");

    return notification;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });
    return result;
  }
}

export default NotificationServices;
