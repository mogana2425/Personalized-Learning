import { Router, Request, Response, NextFunction } from 'express';
import { register, login, googleLogin, forgotPassword, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// SECURITY FIX: /auth/login rate limiter
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const emailKey = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const key = `${req.ip}:${emailKey}`;
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.',
    });
    return;
  }
  next();
};

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

export default router;
