import express from "express";
import { checkAccessToken } from "../../../middlewares/authMiddleware.js";
import FolderController from "./controller.js";

const router = express.Router();

// Create a new folder
router.post("/", checkAccessToken, FolderController.createFolder);

// Get folder tree structure for a workspace
router.get(
  "/workspace/:workspaceId/tree",
  checkAccessToken,
  FolderController.getFolderTree,
);

// Update folder
router.put("/:folderId", checkAccessToken, FolderController.updateFolder);

// Delete folder (requires no children)
router.delete("/:folderId", checkAccessToken, FolderController.deleteFolder);

// Delete folder and all children recursively
router.delete(
  "/:folderId/recursive",
  checkAccessToken,
  FolderController.deleteFolderRecursive,
);

// Get folder path from root to current folder
router.get("/:folderId/path", checkAccessToken, FolderController.getFolderPath);

router.get(
  "/workspace/:workspaceId",
  checkAccessToken,
  FolderController.getPapersAndFolders,
);

export default router;
