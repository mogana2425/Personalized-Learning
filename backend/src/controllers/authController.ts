import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient';
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
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    const sanitizedParentEmail = parentEmail ? parentEmail.trim().toLowerCase() : null;

    // In development mode, allow repeating registrations of the same email by deleting the old one
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV === 'development') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (existingUser) {
        // Cascade delete on progress is handled by DB schema (ON DELETE CASCADE)
        await supabase.from('users').delete().eq('id', existingUser.id);
      }
    }

    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (userExists) {
      res.status(400).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = password ? await bcrypt.hash(password, salt) : null;

    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        name,
        email: sanitizedEmail,
        password: hashedPassword,
        phone,
        role: role || 'student',
        parent_email: role === 'student' ? sanitizedParentEmail : null,
        child_emails: role === 'parent' ? childEmails : null,
      })
      .select()
      .single();

    if (createError || !user) {
      res.status(400).json({ success: false, message: createError?.message || 'Invalid user data' });
      return;
    }

    // If user is a student, automatically initialize their progress tracker document
    if (user.role === 'student') {
      await supabase.from('progress').insert({
        student_id: user.id,
        overall_progress: 0,
        streak: 1,
        last_active_date: new Date().toISOString(),
        weekly_hours: [0, 0, 0, 0, 0, 0, 0],
        completed_topics_count: 0,
        quizzes_taken: [],
        time_spent_minutes: 0,
      });
    }

    res.status(201).json({
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('TESTING REGISTER ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    console.log(`[DEBUG LOGIN] [${new Date().toISOString()}] Attempting login for:`, sanitizedEmail);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    console.log('[DEBUG LOGIN] Database lookup user found:', !!user, 'error:', error);

    if (error || !user || !user.password) {
      console.log('[DEBUG LOGIN] Failure path: User not found or missing password in database.');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[DEBUG LOGIN] password match result:', isMatch);
    if (!isMatch) {
      console.log('[DEBUG LOGIN] Failure path: Password mismatch.');
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Update lastActiveDate if student
    if (user.role === 'student') {
      await supabase
        .from('progress')
        .update({ last_active_date: new Date().toISOString() })
        .eq('student_id', user.id);
    }

    res.json({
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    console.error('TESTING LOGIN ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mobileOtpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    if (otp !== '123456' && otp !== '654321') {
      res.status(400).json({ success: false, message: 'Invalid OTP code. Try 123456.' });
      return;
    }

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!user) {
      const email = `otp_${phone.slice(-4)}@plis.com`;
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: `OTP User ${phone.slice(-4)}`,
          email,
          phone,
          role: 'student',
        })
        .select()
        .single();

      if (createError || !newUser) {
        res.status(400).json({ success: false, message: createError?.message || 'Error creating user via OTP' });
        return;
      }
      user = newUser;

      await supabase.from('progress').insert({
        student_id: user.id,
        overall_progress: 0,
        streak: 1,
        last_active_date: new Date().toISOString(),
        weekly_hours: [0, 0, 0, 0, 0, 0, 0],
        completed_topics_count: 0,
        quizzes_taken: [],
        time_spent_minutes: 0,
      });
    }

    res.json({
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Email and name are required' });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name,
          email: sanitizedEmail,
          role: 'student',
        })
        .select()
        .single();

      if (createError || !newUser) {
        res.status(400).json({ success: false, message: createError?.message || 'Error creating user via Google' });
        return;
      }
      user = newUser;

      await supabase.from('progress').insert({
        student_id: user.id,
        overall_progress: 0,
        streak: 1,
        last_active_date: new Date().toISOString(),
        weekly_hours: [0, 0, 0, 0, 0, 0, 0],
        completed_topics_count: 0,
        quizzes_taken: [],
        time_spent_minutes: 0,
      });
    }

    res.json({
      success: true,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();

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
