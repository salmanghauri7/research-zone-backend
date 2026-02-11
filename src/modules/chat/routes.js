import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import chatController from "./controller.js";

const router = express.Router();

router.get("/workspace/:id/messages", checkAccessToken, chatController.handleMessagesWithPagination);

export default router;