import fetchPapersFromSemanticScholar from "../../utils/fetchPapersFromSemanticScholar.js";

export default class PapersService {
  async searchPapers(query, page = 1, resultsPerPage = 10) {
    try {
      // Calculate pagination offset
      const start = (page - 1) * resultsPerPage;
      const { papers, total } = await fetchPapersFromSemanticScholar({
        query,
        limit: resultsPerPage,
        offset: start,
      });

      return {
        papers,
        pagination: {
          currentPage: page,
          resultsPerPage: resultsPerPage,
          totalResults: total,
          totalPages: Math.ceil(total / resultsPerPage),
          hasMore: page * resultsPerPage < total,
        },
      };
    } catch (error) {
      console.error("Semantic Scholar fetch error:", error);
      if (error?.statusCode === 429) {
        throw error;
      }
      throw new Error("Failed to fetch papers from Semantic Scholar");
    }
  }
}
