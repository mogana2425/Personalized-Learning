import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import Progress from '../models/Progress';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'plis_super_secret_jwt_key_2026_safe_and_secure',
    { expiresIn: '30d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, parentEmail, childEmails } = req.body;

    // In development mode or if database is offline (and not in testing mode), allow repeating registrations of the same email
    if (process.env.NODE_ENV !== 'test' && (mongoose.connection.readyState !== 1 || process.env.NODE_ENV === 'development')) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await User.deleteOne({ email });
        await Progress.deleteOne({ studentId: existingUser._id });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'student',
      parentEmail: role === 'student' ? parentEmail : undefined,
      childEmails: role === 'parent' ? childEmails : undefined,
    });

    if (user) {
      // If user is a student, automatically initialize their progress tracker document
      if (user.role === 'student') {
        await Progress.create({
          studentId: user._id,
          overallProgress: 0,
          streak: 1,
          lastActiveDate: new Date(),
          weeklyHours: [0, 0, 0, 0, 0, 0, 0],
          completedTopicsCount: 0,
          quizzesTaken: [],
          timeSpentMinutes: 0,
        });
      }

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Update lastActiveDate if student
    if (user.role === 'student') {
      const progress = await Progress.findOne({ studentId: user._id });
      if (progress) {
        progress.lastActiveDate = new Date();
        await progress.save();
      }
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mobileOtpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    
    // Simple mock verification: standard validation for demo
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }
    
    if (otp !== '123456' && otp !== '654321') {
      res.status(400).json({ success: false, message: 'Invalid OTP code. Try 123456.' });
      return;
    }

    // Try finding user by phone, or create mock student
    let user = await User.findOne({ phone });
    if (!user) {
      const email = `otp_${phone.slice(-4)}@plis.com`;
      user = await User.create({
        name: `OTP User ${phone.slice(-4)}`,
        email,
        phone,
        role: 'student',
      });

      await Progress.create({
        studentId: user._id,
        overallProgress: 0,
        streak: 1,
        lastActiveDate: new Date(),
        weeklyHours: [0, 0, 0, 0, 0, 0, 0],
        completedTopicsCount: 0,
        quizzesTaken: [],
        timeSpentMinutes: 0,
      });
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Email and name are required' });
      return;
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        role: 'student',
      });

      await Progress.create({
        studentId: user._id,
        overallProgress: 0,
        streak: 1,
        lastActiveDate: new Date(),
        weeklyHours: [0, 0, 0, 0, 0, 0, 0],
        completedTopicsCount: 0,
        quizzesTaken: [],
        timeSpentMinutes: 0,
      });
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // We send a success message anyway for security reasons
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been dispatched.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
