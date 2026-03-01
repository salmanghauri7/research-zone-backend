import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import { uploadMultipleFiles } from "../../middlewares/s3UploadMiddleware.js";
import chatController from "./controller.js";

const router = express.Router();

router.get(
  "/workspace/:id/messages",
  checkAccessToken,
  chatController.handleMessagesWithPagination,
);
router.delete(
  "/workspace/:id/messages",
  chatController.handleDeleteAllMessages,
);

router.post(
  "/workspace/:id/upload",
  checkAccessToken,
  uploadMultipleFiles("files", 10),
  chatController.handleFileUpload,
);

router.post("/workspace/:id/search", checkAccessToken, chatController.handleSearchInWorkspace);

export default router;
