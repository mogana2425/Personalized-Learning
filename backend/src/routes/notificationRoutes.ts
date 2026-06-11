import { Router, Response } from 'express';
import { AuthenticatedRequest, protect } from '../middleware/authMiddleware';
import Notification from '../models/Notification';

const router = Router();

// Get list of user notifications
router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
