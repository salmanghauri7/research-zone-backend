import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../../../utils/apiError.js";
import BaseRepository from "../../../utils/baseRepository.js";
import SavedPaper from "../saved-papers/model.js";
import RadarSyncLog from "./radarSyncModel.js";
import { config } from "../../../constants/config.js";
import { buildRadarPrompt } from "./radarPrompt.js";
import { responseSchema } from "./radarPrompt.js";
import fetchPapersFromSemanticScholar from "../../../utils/fetchPapersFromSemanticScholar.js";

export default class RadarService extends BaseRepository {
  constructor(model) {
    super(model);
  }

  async fetchUniqueCategories(workspaceId) {
    try {
      return await SavedPaper.distinct("category", { workspaceId });
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to fetch unique categories",
        error.statusCode || 500,
      );
    }
  }

  async getRadarNotifications({ workspaceId, cursor, limit = 20 }) {
    try {
      const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
      const query = { workspaceId };

      if (cursor) {
        const cursorDate = new Date(cursor);
        if (!Number.isNaN(cursorDate.getTime())) {
          query.createdAt = { $lt: cursorDate };
        }
      }

      const items = await this.model
        .find(query)
        .sort({ createdAt: -1 })
        .limit(sanitizedLimit);

      const nextCursor = items.length
        ? items[items.length - 1].createdAt?.toISOString()
        : null;

      return { items, nextCursor };
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to fetch radar notifications",
        error.statusCode || 500,
      );
    }
  }

  async fetchPapersOfCategory(workspaceId, category) {
    try {
      return await SavedPaper.find({ workspaceId, category })
        .limit(10)
        .select("title summary authors link");
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to fetch papers for category",
        error.statusCode || 500,
      );
    }
  }

  async fetchLatestArxivPapers(category, lookbackDays) {
    try {
      const maxResults = 20;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(lookbackDays));
      const fieldsOfStudy = mapArxivCategoryToFieldsOfStudy(category);

      const { papers } = await fetchPapersFromSemanticScholar({
        query: category,
        fieldsOfStudy,
        limit: maxResults,
        offset: 0,
        publishedAfter: cutoffDate,
      });

      return papers.map((paper) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        link: paper.link,
        summary: paper.summary,
      }));
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to fetch latest papers",
        error.statusCode || 500,
      );
    }
  }

  async analyzeWithGemini(newPapers, savedPapers) {
    try {
      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY_FOR_FOR_RADAR);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const prompt = buildRadarPrompt(newPapers, savedPapers);

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const findings = JSON.parse(text);
      return findings
        .map((finding) => {
          const paper = newPapers.find((p) => p.id === finding.arxivId);
          return {
            ...finding,
            paper: paper || null,
          };
        })
        .filter((f) => f.paper !== null); // drop any Gemini hallucinated IDs
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to analyze papers with Gemini",
        error.statusCode || 500,
      );
    }
  }

  async saveRadar(workspaceId, category, alertType, newPapers) {
    try {
      const normalizedNewPapers = (newPapers || [])
        .map((paper) => {
          const authors = Array.isArray(paper?.authors)
            ? paper.authors
            : typeof paper?.authors === "string"
              ? paper.authors
                  .split(",")
                  .map((author) => author.trim())
                  .filter(Boolean)
              : [];

          return {
            authors,
            title: paper?.title || paper?.paper || "",
            link: paper?.link || "",
          };
        })
        .filter(
          (paper) =>
            paper.authors.length > 0 &&
            paper.title.trim().length > 0 &&
            paper.link.trim().length > 0,
        );

      return await this.create({
        workspaceId,
        category,
        alertType,
        papersScanned: newPapers?.length || 0,
        newPapers: normalizedNewPapers,
      });
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to save radar document",
        error.statusCode || 500,
      );
    }
  }

  async getRadarStatus(workspaceId) {
    try {
      return await RadarSyncLog.find({ workspaceId }).select("status -_id");
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to fetch radar status",
        error.statusCode || 500,
      );
    }
  }

  async updateRadarStatus(workspaceId, status) {
    try {
      await RadarSyncLog.findOneAndUpdate(
        { workspaceId },
        { $set: { status } },
      );
    } catch (error) {
      throw new ApiError(
        error.message || "Failed to update radar status",
        error.statusCode || 500,
      );
    }
  }
}

function mapArxivCategoryToFieldsOfStudy(category) {
  if (!category || typeof category !== "string") {
    return undefined;
  }

  const normalized = category.trim().toLowerCase();

  if (normalized.startsWith("cs.")) {
    return ["Computer Science"];
  }
  if (normalized.startsWith("math.")) {
    return ["Mathematics"];
  }
  if (
    normalized.startsWith("physics.") ||
    normalized.startsWith("cond-mat.") ||
    normalized.startsWith("quant-ph")
  ) {
    return ["Physics"];
  }
  if (normalized.startsWith("stat.")) {
    return ["Mathematics"];
  }
  if (normalized.startsWith("bio.") || normalized.startsWith("q-bio.")) {
    return ["Biology"];
  }
  if (normalized.startsWith("econ.")) {
    return ["Economics"];
  }
  if (normalized.startsWith("eess.")) {
    return ["Engineering"];
  }

  return undefined;
}
