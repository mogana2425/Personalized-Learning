import { Router } from 'express';
import { processAnswerSheet, getMyAnswerSheets, uploadMiddleware } from '../controllers/uploadController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/answer-sheet', protect, uploadMiddleware, processAnswerSheet);
router.get('/my-sheets', protect, getMyAnswerSheets);

export default router;
