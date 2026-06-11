import { Router } from 'express';
import { register, login, mobileOtpLogin, googleLogin, forgotPassword, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/mobile-otp', mobileOtpLogin);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

export default router;
