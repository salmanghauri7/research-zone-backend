import { config } from "../../constants/config.js";
import { ApiError } from "../../utils/apiError.js";
import SavedPaper from "../workspaces/saved-papers/model.js";
import Conversation from "./conversationModel.js";

export default class PaperChatService {
  getEmbeddingServiceBaseUrl() {
    const isProduction = config.NODE_ENV === "production";

    if (isProduction) {
      return config.EMBEDDING_SERVICE_URL_PROD;
    }

    return config.EMBEDDING_SERVICE_URL_DEV || "http://localhost:8000";
  }

  async createEmbeddings({ paperId, pdfUrl }) {
    const baseUrl = this.getEmbeddingServiceBaseUrl();
    const endpoint = `${baseUrl}/api/v1/embeddings`;

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdf_url: pdfUrl,
          paper_id: paperId,
        }),
      });
    } catch (error) {
      throw new ApiError("Failed to connect to embedding microservice", 502);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new ApiError(
        errorText || "Embedding microservice request failed",
        response.status || 502,
      );
    }

    return {
      summaryGenerated: false,
    };
  }

  /**
   * Checks if the summary for a given paper has already been generated
   * @param {string} paperId - The ID of the paper
   * @returns {boolean} - True if summary is generated, false otherwise
   */
  async IsSummaryGenerated(paperId) {
    try {
      const paper = await SavedPaper.findById(paperId);
      if (!paper) {
        throw new ApiError("Paper not found", 404);
      }
      return paper.summaryGenerated || false;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Error checking if summary is generated", 500);
    }
  }

  /**
   * Fetches the recent conversation history for a specific paper and user
   * @param {string} paperId - The ID of the paper
   * @param {string} userId - The ID of the user
   * @returns {Array} - The 7 most recent messages chronologically
   */
  async fetchConversationHistory(paperId, userId) {
    try {
      let recentMessages = await Conversation.find({ paperId, userId })

        .limit(7)
        .lean();

      return recentMessages;
    } catch (error) {
      throw new ApiError("Error fetching conversation history", 500);
    }
  }

  /**
   * Sends a message to the embedding microservice to chat with a paper
   * @param {Object} params
   * @param {string} params.paperId
   * @param {string} params.userId
   * @param {string} params.question
   * @param {Array} params.conversationHistory
   */
  async chatWithPaper({ paperId, userId, question, conversationHistory }) {
    const baseUrl = this.getEmbeddingServiceBaseUrl();
    const endpoint = `${baseUrl}/api/v1/paperChat`;

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper_id: paperId,
          user_id: userId,
          question,
          conversation_history: conversationHistory,
        }),
      });
    } catch (error) {
      throw new ApiError("Failed to connect to embedding microservice", 502);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new ApiError(
        errorText || "Embedding microservice request failed",
        response.status || 502,
      );
    }

    return await response.json();
  }
}
