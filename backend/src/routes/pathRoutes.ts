import { Router } from 'express';
import { getPath, generatePath, updateSubTopicStatus, generateLessonContent } from '../controllers/pathController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getPath);
router.post('/generate', protect, generatePath);
router.put('/subtopic-status', protect, updateSubTopicStatus);
router.post('/lesson/generate', protect, generateLessonContent);

export default router;
