import { XMLParser } from "fast-xml-parser";

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

    throw lastError || new Error('Unknown arXiv request error');
  }

  async searchArxiv(query, page = 1, resultsPerPage = 10) {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    try {
      // Calculate pagination offset
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeResultsPerPage =
        Number.isFinite(resultsPerPage) && resultsPerPage > 0
          ? Math.min(resultsPerPage, 50)
          : 10;
      const start = (safePage - 1) * safeResultsPerPage;

      // Construct the arXiv API URL with pagination
      const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query.trim())}&start=${start}&max_results=${safeResultsPerPage}`;

      // Fetch the data from arXiv
      const response = await this.fetchArxivWithRetry(arxivUrl, 2);

      const xmlData = await response.text();

      // Parse the XML into JSON
      const parser = new XMLParser({ ignoreAttributes: false });
      const jsonData = parser.parse(xmlData);

      if (!jsonData?.feed) {
        throw new Error('Invalid response received from arXiv');
      }

      // Get total results from arXiv feed
      const totalResults = parseInt(jsonData.feed['opensearch:totalResults']) || 0;

      // Normalize entries (arXiv returns single entry as object, multiple as array)
      let entries = jsonData.feed.entry || [];
      if (!Array.isArray(entries)) {
        entries = [entries];
      }

      // Format the papers data
      const formattedPapers = entries.map((entry, index) => {
        const safeEntry = entry || {};

        // Handle authors (could be a single object or an array)
        let authorsList = safeEntry.author || [];
        if (!Array.isArray(authorsList)) {
          authorsList = [authorsList];
        }
        const authorNames = authorsList
          .map((author) => author?.name)
          .filter(Boolean)
          .join(', ');

        return {
          id: safeEntry.id || String(index),
          title: (safeEntry.title || '').replace(/[\n\r]/g, ' ').trim(),
          authors: authorNames || 'Unknown authors',
          published: safeEntry.published
            ? new Date(safeEntry.published).toISOString().split('T')[0]
            : '',
          summary: (safeEntry.summary || '').trim(),
          link: safeEntry.id || '',
        };
      });

      return {
        papers: formattedPapers,
        pagination: {
          currentPage: safePage,
          resultsPerPage: safeResultsPerPage,
          totalResults: totalResults,
          totalPages: Math.ceil(totalResults / safeResultsPerPage),
          hasMore: (safePage * safeResultsPerPage) < totalResults
        }
      };
    } catch (error) {
      console.error('arXiv fetch error:', error);
      throw new Error(error?.message || 'Failed to fetch papers from arXiv');
    }
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
  // Calculate pagination offset
  const start = (page - 1) * resultsPerPage;

  // Construct the arXiv API URL with pagination
  const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=${start}&max_results=${resultsPerPage}`;

  // Fetch the data from arXiv (retry up to 3 times on 429)
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(arxivUrl);

    if (response.status !== 429) {
      break;
    }

    if (attempt < 2) {
      await sleep(300);
    }
  }

  if (response.status === 429) {
    const rateLimitError = new Error(
      "Rate limit exceeded for arXiv. Please try again shortly.",
    );
    rateLimitError.statusCode = 429;
    throw rateLimitError;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch from arXiv");
  }

  const xmlData = await response.text();

  // Parse the XML into JSON
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonData = parser.parse(xmlData);

  // Get total results from arXiv feed
  const totalResults =
    parseInt(jsonData.feed["opensearch:totalResults"]) || 0;

  // Normalize entries (arXiv returns single entry as object, multiple as array)
  let entries = jsonData.feed.entry || [];
  if (!Array.isArray(entries)) {
    entries = [entries];
  }

  // Format the papers data
  const formattedPapers = entries.map((entry, index) => {
    // Handle authors (could be a single object or an array)
    let authorsList = entry.author;
    if (!Array.isArray(authorsList)) {
      authorsList = [authorsList];
    }
    const authorNames = authorsList.map((a) => a.name).join(", ");

    // Find the PDF link
    let pdfLink = entry.id; // Fallback to main ID link
    if (Array.isArray(entry.link)) {
      const pdfNode = entry.link.find((l) => l["@_title"] === "pdf");
      if (pdfNode) pdfLink = pdfNode["@_href"];
    }
    const category = entry["arxiv:primary_category"]?.["@_term"] || "";

    return {
      id: entry.id || String(index),
      title: entry.title.replace(/[\n\r]/g, " ").trim(),
      authors: authorNames,
      published: new Date(entry.published).toISOString().split("T")[0],
      summary: entry.summary.trim(),
      link: entry.id,
      category,
    };
  });

  return {
    papers: formattedPapers,
    pagination: {
      currentPage: page,
      resultsPerPage: resultsPerPage,
      totalResults: totalResults,
      totalPages: Math.ceil(totalResults / resultsPerPage),
      hasMore: page * resultsPerPage < totalResults,
    },
  };
} catch (error) {
  console.error("arXiv fetch error:", error);
  if (error?.statusCode === 429) {
    throw error;
  }
  throw new Error("Failed to fetch papers from arXiv");
}
  }
}
