import { XMLParser } from 'fast-xml-parser';

export default class PapersService {
    async searchArxiv(query, page = 1, resultsPerPage = 10) {
        if (!query || query.trim() === '') {
            throw new Error('Search query is required');
        }

        try {
            // Calculate pagination offset
            const start = (page - 1) * resultsPerPage;

            // Construct the arXiv API URL with pagination
            const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=${start}&max_results=${resultsPerPage}`;

            // Fetch the data from arXiv
            const response = await fetch(arxivUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch from arXiv');
            }

            const xmlData = await response.text();

            // Parse the XML into JSON
            const parser = new XMLParser({ ignoreAttributes: false });
            const jsonData = parser.parse(xmlData);

            // Get total results from arXiv feed
            const totalResults = parseInt(jsonData.feed['opensearch:totalResults']) || 0;

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
                const authorNames = authorsList.map(a => a.name).join(', ');

                // Find the PDF link
                let pdfLink = entry.id; // Fallback to main ID link
                if (Array.isArray(entry.link)) {
                    const pdfNode = entry.link.find(l => l['@_title'] === 'pdf');
                    if (pdfNode) pdfLink = pdfNode['@_href'];
                }

                return {
                    id: entry.id || String(index),
                    title: entry.title.replace(/[\n\r]/g, ' ').trim(),
                    authors: authorNames,
                    published: new Date(entry.published).toISOString().split('T')[0],
                    summary: entry.summary.trim(),
                    link: entry.id,
                   
                };
            });

            return {
                papers: formattedPapers,
                pagination: {
                    currentPage: page,
                    resultsPerPage: resultsPerPage,
                    totalResults: totalResults,
                    totalPages: Math.ceil(totalResults / resultsPerPage),
                    hasMore: (page * resultsPerPage) < totalResults
                }
            };
        } catch (error) {
            console.error('arXiv fetch error:', error);
            throw new Error('Failed to fetch papers from arXiv');
        }
    }
}
