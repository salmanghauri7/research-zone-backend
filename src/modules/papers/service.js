import fetchPapersFromSemanticScholar from "../../utils/fetchPapersFromSemanticScholar.js";

export default class PapersService {
  async fetchArxivWithRetry(url, retries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'research-zone-backend/1.0 (arxiv-integration)',
            'Accept': 'application/atom+xml, text/xml;q=0.9, */*;q=0.8',
          },
        });

        if (response.ok) {
          return response;
        }

        const responseText = await response.text();
        const statusError = new Error(
          `arXiv request failed with status ${response.status}: ${responseText?.slice(0, 200) || response.statusText}`,
        );
        statusError.status = response.status;
        lastError = statusError;

        const shouldRetry = response.status === 429 || response.status >= 500;
        if (!shouldRetry || attempt === retries) {
          throw statusError;
        }
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          throw error;
        }
      }

      const backoffMs = 500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

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
