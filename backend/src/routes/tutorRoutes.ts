import { Router } from 'express';
import { sendMessage, getChatHistory } from '../controllers/tutorController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);

export default router;
