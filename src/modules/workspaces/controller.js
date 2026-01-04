import { errorMessages, successMessages } from "../../constants/messages.js";
import { ApiError } from "../../utils/apiError.js";
import apiResponse from "../../utils/apiResponse.js";
import Workspace from "./model.js";
import workspaceServices from "./services.js";

const workspaceDb = new workspaceServices(Workspace);

export default class workspaceController {
  static async createWorkspace(req, res) {
    try {
      const { title } = req.body;
      const user = req.user;

      if (!title) {
        throw new ApiError(errorMessages.WORKSPACE.TITLE_NOT_FOUND, 400);
      }
      const workspace = await workspaceDb.createWorkspace({ title, user });

      return apiResponse.success(
        res,
        successMessages.WORKSPACE.CREATE_SUCCESS,
        200,
        workspace
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.CREATE_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async getOwnerWorkspaces(req, res) {
    try {
      const user = req.user;
      const workspaces = await workspaceDb.getOwnerWorkspaces(user);
      return apiResponse.success(
        res,
        successMessages.GET_WORKSPACES_SUCCESS,
        200,
        workspaces
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.GET_WORKSPACES_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async getAllWorkspaces(req, res) {
    try {
      const user = req.user;
      const workspaces = await workspaceDb.getAllWorkspaces(user);
      return apiResponse.success(
        res,
        successMessages.WORKSPACE.GET_WORKSPACES_SUCCESS,
        200,
        workspaces
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.GET_WORKSPACES_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async inviteUser(req, res) {
    try {
      const { email } = req.body;
      const { workspaceId } = req.params;
      const user = req.user;

      if (!email) {
        throw new ApiError(errorMessages.WORKSPACE.EMAIL_NOT_PROVIDED, 400);
      }

      if (!workspaceId) {
        throw new ApiError(
          errorMessages.WORKSPACE.WORKSPACE_ID_NOT_PROVIDED,
          400
        );
      }

      const invitation = await workspaceDb.inviteUserToWorkspace({
        email,
        workspaceId,
        inviter: user,
      });

      return apiResponse.success(
        res,
        successMessages.WORKSPACE.INVITATION_SENT,
        200,
        invitation
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.INVITATION_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async verifyInvitation(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError(errorMessages.WORKSPACE.TOKEN_NOT_PROVIDED, 400);
      }

      const invitation = await workspaceDb.verifyInvitationToken(token);

      return apiResponse.success(
        res,
        successMessages.WORKSPACE.TOKEN_VERIFIED,
        200,
        invitation
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.TOKEN_VERIFICATION_FAILED,
        err.statusCode || 500
      );
    }
  }

  static async acceptInvitation(req, res) {
    try {
      const { token } = req.body;
      const user = req.user;

      if (!token) {
        throw new ApiError(errorMessages.WORKSPACE.TOKEN_NOT_PROVIDED, 400);
      }

      const result = await workspaceDb.acceptInvitation({ token, user });

      return apiResponse.success(
        res,
        successMessages.WORKSPACE.INVITATION_ACCEPTED,
        200,
        result
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.WORKSPACE.ACCEPT_INVITATION_FAILED,
        err.statusCode || 500
      );
    }
  }
}
