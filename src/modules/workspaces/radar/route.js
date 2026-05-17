import express from "express";
import { checkAccessToken } from "../../../middlewares/authMiddleware.js";
import RadarController from "./controller.js";

const router = express.Router();

router.post("/", checkAccessToken, RadarController.getInsights);
router.get("/categories", checkAccessToken, RadarController.getCategories);
router.get(
  "/notifications",
  checkAccessToken,
  RadarController.getNotifications,
);

export default router;
