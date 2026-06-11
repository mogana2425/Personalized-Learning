import { Router } from 'express';
import { getPosts, createPost, addReply, upvotePost } from '../controllers/communityController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, createPost);
router.post('/:id/reply', protect, addReply);
router.put('/:id/upvote', protect, upvotePost);

export default router;
