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

      const messagesWithUrls =
        chatServices.getCloudFrontUrlsForAttachments(messages);

      return apiResponse.success(
        res,
        successMessages.CHAT?.MESSAGES_FETCHED ||
          "Messages fetched successfully",
        200,
        {
          messages: messagesWithUrls,
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

  static async handleDeleteAllMessages(req, res) {
    try {
      const workspaceId = req.params.id;

      const deletedCount =
        await chatServices.deleteAllMessagesByWorkspace(workspaceId);

      return apiResponse.success(
        res,
        successMessages.CHAT?.MESSAGES_DELETED ||
          "All messages deleted successfully",
        200,
        {
          deletedCount,
        },
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message ||
          errorMessages.CHAT?.DELETE_MESSAGES_FAILED ||
          "Failed to delete messages",
        err.statusCode || 500,
      );
    }
  }

  static async handleFileUpload(req, res) {
    try {
      // Check if any files were uploaded
      if (!req.files || req.files.length === 0) {
        return apiResponse.error(
          res,
          "No files uploaded. Please upload at least one file.",
          400,
        );
      }

      const attachments = await Promise.all(
        req.files.map(async (file) => {
          // Validate that the file has a key (S3 object key)
          if (!file.key) {
            throw new Error(
              `File ${file.originalname} was not properly uploaded to S3`,
            );
          }

          const cloudFrontUrl = chatServices.generateCloudFrontUrlForFile(file.key);

          return {
            url: cloudFrontUrl, // CloudFront URL
            fileName: file.originalname,
            fileKey: file.key, // ALWAYS save this to your DB
            fileSize: file.size,
            mimeType: file.mimetype,
          };
        }),
      );

      return apiResponse.success(res, "Files uploaded successfully", 200, {
        attachments, // Now matches schema exactly
        totalFiles: attachments.length,
      });
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || "Failed to upload files",
        err.statusCode || 500,
      );
    }
  }
}
