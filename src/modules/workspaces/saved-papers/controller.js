import { errorMessages, successMessages } from "../../../constants/messages.js";
import { ApiError } from "../../../utils/apiError.js";
import apiResponse from "../../../utils/apiResponse.js";
import SavedPaper from "./model.js";
import SavedPaperServices from "./services.js";

const savedPaperDb = new SavedPaperServices(SavedPaper);

export default class SavedPaperController {
  /**
   * Save a paper to workspace
   * @route POST /api/saved-papers
   */
  static async savePaper(req, res) {
    try {
      const { workspaceId, folderId, title, link, authors, published } =
        req.body;
      const user = req.user;

      if (!workspaceId) {
        throw new ApiError(
          errorMessages.SAVED_PAPER.WORKSPACE_ID_REQUIRED,
          400,
        );
      }

      if (!title || !title.trim()) {
        throw new ApiError(errorMessages.SAVED_PAPER.TITLE_REQUIRED, 400);
      }

      if (!link || !link.trim()) {
        throw new ApiError(errorMessages.SAVED_PAPER.LINK_REQUIRED, 400);
      }

      let formattedLink = link.trim();
      if (formattedLink.includes("arxiv.org/abs/")) {
        formattedLink = formattedLink.replace(
          "arxiv.org/abs/",
          "arxiv.org/pdf/",
        );
      }

      const savedPaper = await savedPaperDb.savePaper({
        workspaceId,
        userId: user.id,
        folderId: folderId || null,
        title: title.trim(),
        link: formattedLink,
        authors: authors || "",
        published: published || "",
      });

      return apiResponse.success(
        res,
        successMessages.SAVED_PAPER.SAVE_SUCCESS,
        201,
        savedPaper,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.SAVED_PAPER.SAVE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Move paper to different folder
   * @route PATCH /api/saved-papers/:paperId/move
   */
  static async movePaper(req, res) {
    try {
      const { paperId } = req.params;
      const { folderId } = req.body;
      const user = req.user;

      if (!paperId) {
        throw new ApiError(errorMessages.SAVED_PAPER.ID_REQUIRED, 400);
      }

      const updatedPaper = await savedPaperDb.movePaper(
        paperId,
        folderId,
        user.id,
      );

      return apiResponse.success(
        res,
        successMessages.SAVED_PAPER.MOVE_SUCCESS,
        200,
        updatedPaper,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.SAVED_PAPER.MOVE_FAILED,
        err.statusCode || 500,
      );
    }
  }

  /**
   * Delete a saved paper
   * @route DELETE /api/saved-papers/:paperId
   */
  static async deleteSavedPaper(req, res) {
    try {
      const { paperId } = req.params;
      const user = req.user;

      if (!paperId) {
        throw new ApiError(errorMessages.SAVED_PAPER.ID_REQUIRED, 400);
      }

      const result = await savedPaperDb.deleteSavedPaper(paperId, user.id);

      return apiResponse.success(
        res,
        successMessages.SAVED_PAPER.DELETE_SUCCESS,
        200,
        result,
      );
    } catch (err) {
      return apiResponse.error(
        res,
        err.message || errorMessages.SAVED_PAPER.DELETE_FAILED,
        err.statusCode || 500,
      );
    }
  }
}
