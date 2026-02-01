import express from "express";
import { checkAccessToken } from "../../middlewares/authMiddleware.js";
import workspaceController from "./controller.js";

const router = express.Router();

router.post("/create", checkAccessToken, workspaceController.createWorkspace);
router.get("/owner", checkAccessToken, workspaceController.getOwnerWorkspaces);
router.get("/all", checkAccessToken, workspaceController.getAllWorkspaces);
router.post(
  "/:workspaceId/invite",
  checkAccessToken,
  workspaceController.inviteUser,
);
router.post("/verify-invitation", workspaceController.verifyInvitation);
router.post(
  "/accept-invitation",
  checkAccessToken,
  workspaceController.acceptInvitation,
);

router.delete(
  "/leave/:workSpaceId",
  checkAccessToken,
  workspaceController.leaveWorkspace,
);

router.get(
  "/check-role/:workspaceId",
  checkAccessToken,
  workspaceController.checkWorkspaceRole,
);

export default router;
