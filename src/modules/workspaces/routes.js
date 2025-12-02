import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import workspaceController from "./controller.js";

const router = express.Router();

router.post("/create", checkAccessToken, workspaceController.createWorkspace);

export default router;
