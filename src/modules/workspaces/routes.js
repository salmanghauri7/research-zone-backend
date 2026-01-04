import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import workspaceController from "./controller.js";

const router = express.Router();

router.post("/create", checkAccessToken, workspaceController.createWorkspace);
router.get("/owner", checkAccessToken, workspaceController.getOwnerWorkspaces);
router.post(
  "/:workspaceId/invite",
  checkAccessToken,
  workspaceController.inviteUser
);
router.post("/verify-invitation", workspaceController.verifyInvitation);
router.post(
  "/accept-invitation",
  checkAccessToken,
  workspaceController.acceptInvitation
);

export default router;
