import Message from "./model.js";
import ChatServices from "./services.js";
import apiResponse from "../../utils/apiResponse.js";
import { errorMessages, successMessages } from "../../constants/messages.js";

const chatServices = new ChatServices(Message);
export default class chatController {
  static async handleMessagesWithPagination(req, res) {
    try {
      const limit = req.query.limit;
      const cursor = req.query.cursor;

      const workspaceId = req.params.id;
      const user = req.user;

      await chatServices.validateWorkspaceAccess(workspaceId, user.id);

      const { messages, nextCursor } =
        await chatServices.getMessagesbyPagination(workspaceId, limit, cursor);

      return apiResponse.success(
        res,
        successMessages.CHAT?.MESSAGES_FETCHED ||
          "Messages fetched successfully",
        200,
        {
          messages,
          cursor: nextCursor,
          hasMore: messages.length === parseInt(limit),
        },
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message ||
          errorMessages.CHAT?.FETCH_MESSAGES_FAILED ||
          "Failed to fetch messages",
        err.statusCode || 500,
      );
    }
  }
}
