import express from "express";
import userRoute from "../modules/users/routes.js";
import  workspaceRoute from "../modules/workspaces/routes.js";

export default function routes(app) {
  const apiRoute = express.Router();
  apiRoute.use("/users", userRoute);
  apiRoute.use("/workspaces", workspaceRoute);

  app.use("/api", apiRoute);
}
