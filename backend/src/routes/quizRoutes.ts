import { Router } from 'express';
import { getAssessment, submitAssessment, getQuizById, submitQuiz, createQuiz } from '../controllers/quizController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

router.get('/assessment', protect, getAssessment);
router.post('/assessment/submit', protect, submitAssessment);

router.post('/create', protect, restrictTo('teacher', 'admin'), createQuiz);
router.get('/:id', protect, getQuizById);
router.post('/:id/submit', protect, submitQuiz);

export default router;
