import apiResponse from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import PaperChatService from "./services.js";
import { errorMessages, successMessages } from "../../constants/messages.js";

const paperChatService = new PaperChatService();

export default class PaperChatController {
  static async createEmbeddings(req, res) {
    try {
      const { paperId, pdfUrl } = req.body;
      const userId = req.user?.id || req.user?._id || req.body.userId;

      if (!paperId || !String(paperId).trim()) {
        throw new ApiError(
          errorMessages.PAPER_CHAT?.PAPER_ID_REQUIRED || "paperId is required",
          400,
        );
      }

      if (!pdfUrl || !String(pdfUrl).trim()) {
        throw new ApiError(
          errorMessages.PAPER_CHAT?.PDF_URL_REQUIRED || "pdfUrl is required",
          400,
        );
      }

      // Check if the paper summary has already been generated
      const summaryGenerated =
        await paperChatService.IsSummaryGenerated(paperId);
      if (summaryGenerated) {
        // If it is generated, fetch the recent conversation history
        const conversationHistory =
          await paperChatService.fetchConversationHistory(paperId, userId);

        return apiResponse.success(
          res,
          "Conversation history fetched successfully",
          200,
          {
            success: true,
            messages: conversationHistory,
          },
        );
      }

      // If summary is not generated, call the embeddings endpoint
      const result = await paperChatService.createEmbeddings({
        paperId: String(paperId).trim(),
        pdfUrl: String(pdfUrl).trim(),
      });

      return apiResponse.success(
        res,
        successMessages.PAPER_CHAT?.EMBEDDING_CREATED ||
          "Embedding request successful",
        200,
        {
          success: true,
          messages: [],
        },
      );
    } catch (error) {
      return apiResponse.error(
        res,
        error.message ||
          errorMessages.PAPER_CHAT?.EMBEDDING_CREATE_FAILED ||
          "Failed to create embeddings",
        error.statusCode || 500,
      );
    }
  }

  static async chatWithPaper(req, res) {
    try {
      const { paperId, question } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!paperId) {
        throw new ApiError("paperId is required", 400);
      }
      if (!question) {
        throw new ApiError("question is required", 400);
      }

      const conversationHistory =
        await paperChatService.fetchConversationHistory(paperId, userId);

      const answer = await paperChatService.chatWithPaper({
        paperId,
        userId,
        question,
        conversationHistory,
      });

      return apiResponse.success(res, "Message sent successfully", 200, answer);
    } catch (error) {
      return apiResponse.error(
        res,
        error.message || "Failed to chat with paper",
        error.statusCode || 500,
      );
    }
  }
}
