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
}
