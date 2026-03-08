import express from "express";
import { checkAccessToken } from "../../../middlewares/authMiddleware.js";
import SavedPaperController from "./controller.js";

const router = express.Router();

// Save a paper to workspace
router.post("/", checkAccessToken, SavedPaperController.savePaper);


// Move paper to different folder
router.patch(
  "/:paperId/move",
  checkAccessToken,
  SavedPaperController.movePaper,
);

// Delete saved paper
router.delete(
  "/:paperId",
  checkAccessToken,
  SavedPaperController.deleteSavedPaper,
);

export default router;
