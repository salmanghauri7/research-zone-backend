import apiResponse from "../../../utils/apiResponse.js";
import RadarService from "./service.js";
import { ApiError } from "../../../utils/apiError.js";
import Radar from "./radarModel.js";
import { fetchQueue } from "./jobs/queue.radar.js";

const radarService = new RadarService(Radar);
export default class RadarController {
  static async getNotifications(req, res) {
    try {
      const { workspaceId, cursor, limit } = req.query;

      if (!workspaceId) {
        return apiResponse.error(res, "workspaceId is required", 400);
      }

      const parsedLimit = Number(limit);

      const result = await radarService.getRadarNotifications({
        workspaceId,
        cursor,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      });

      return apiResponse.success(res, "Radar notifications fetched", 200, {
        items: result.items,
        nextCursor: result.nextCursor,
      });
    } catch (error) {
      return apiResponse.error(
        res,
        error.message || "Failed to fetch radar notifications",
        error.statusCode || 500,
      );
    }
  }

  static async getCategories(req, res) {
    try {
      const { workspaceId } = req.query;

      if (!workspaceId) {
        return apiResponse.error(res, "workspaceId is required", 400);
      }

      const categories = await radarService.fetchUniqueCategories(workspaceId);

      return apiResponse.success(res, "Categories fetched", 200, {
        categories,
      });
    } catch (error) {
      return apiResponse.error(
        res,
        error.message || "Failed to fetch categories",
        error.statusCode || 500,
      );
    }
  }

  static async getInsights(req, res) {
    try {
      let { categories, workspaceId } = req.body;
      const user = req.user;

      const status = await radarService.getRadarStatus(workspaceId);
      if (status.running) {
        return apiResponse.error(res, "Radar is already running", 409);
      }

      if (!categories) {
        categories = await radarService.fetchUniqueCategories(workspaceId);
      }

      if (categories.length === 0) {
        return apiResponse.error(
          res,
          "No categories found. Save some papers first.",
          400,
        );
      }

      await radarService.updateRadarStatus(workspaceId, "running");

      for (const category of categories) {
        await fetchQueue.add("fetch-papers", {
          workspaceId,
          category,
          userId: user.id,
          totalCategories: categories.length,
        });
      }

      return apiResponse.success(res, "Radar started", 202, {
        categories,
        total: categories.length,
      });
    } catch (error) {
      return apiResponse.error(
        res,
        error.message || "Internal Server Error",
        error.statusCode || 500,
      );
    }
  }
}
