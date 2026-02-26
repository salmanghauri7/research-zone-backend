import express from 'express';
import PapersController from './controller.js';

const router = express.Router();

router.get('/search', PapersController.searchPapers);

export default router;
