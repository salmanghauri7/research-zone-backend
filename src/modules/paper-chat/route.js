import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import PaperChatController from "./controller.js";

const router = express.Router();

router.post(
  "/embeddings",
  checkAccessToken,
  PaperChatController.createEmbeddings,
);

router.post("/question", checkAccessToken, PaperChatController.chatWithPaper)
export default router;
