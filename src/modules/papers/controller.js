import PapersService from './service.js';
import apiResponse from '../../utils/apiResponse.js';
import { errorMessages, successMessages } from '../../constants/messages.js';

const papersService = new PapersService();

export default class PapersController {
    static async searchPapers(req, res) {
        try {
            const query = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const resultsPerPage = parseInt(req.query.limit) || 10;

            if (!query) {
                return apiResponse.error(
                    res,
                    'Search query is required',
                    400
                );
            }

            const { papers, pagination } = await papersService.searchArxiv(query, page, resultsPerPage);

            return apiResponse.success(
                res,
                successMessages.PAPERS?.SEARCH_SUCCESSFUL || 'Papers fetched successfully',
                200,
                {
                    results: papers,
                    pagination: pagination
                }
            );
        } catch (error) {
            console.error('Papers search error:', error);
            return apiResponse.error(
                res,
                error.message || errorMessages.PAPERS?.SEARCH_FAILED || 'Failed to search papers',
                error.statusCode || 500
            );
        }
    }
}
