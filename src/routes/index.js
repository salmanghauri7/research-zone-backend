import express from "express";
import userRoute from "../modules/users/routes.js";
import workspaceRoute from "../modules/workspaces/routes.js";
import chatRoute from "../modules/chat/routes.js";
import papersRoute from "../modules/papers/route.js";
import folderRoute from "../modules/workspaces/folders/routes.js";
import savedPaperRoute from "../modules/workspaces/saved-papers/routes.js";
import notificationRoute from "../modules/notifications/routes.js";

export default function routes(app) {
  const apiRoute = express.Router();
  apiRoute.use("/users", userRoute);
  apiRoute.use("/workspaces", workspaceRoute);
  apiRoute.use("/chat", chatRoute);
  apiRoute.use("/papers", papersRoute);
  apiRoute.use("/folders", folderRoute);
  apiRoute.use("/saved-papers", savedPaperRoute);
  apiRoute.use("/notifications", notificationRoute);

  app.use("/api", apiRoute);
}
