import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "./controller.js";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";

const notificationRoutes = Router();

// Apply auth middleware to all notification routes
notificationRoutes.use(checkAccessToken);

notificationRoutes.get("/", getNotifications);
notificationRoutes.patch("/:id/read", markAsRead);
notificationRoutes.delete("/:id", deleteNotification);

export default notificationRoutes;
