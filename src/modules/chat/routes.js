import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import chatController from "./controller.js";

const router = express.Router();

router.get("/worksapce/:id/messages", checkAccessToken, chatController.handleMessagesWithPagination);

export default router;