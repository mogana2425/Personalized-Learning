import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// SECURITY FIX: the previous fallback `'plis_super_secret_jwt_key_2026_safe_and_secure'`
// was a hardcoded, publicly-visible default. If JWT_SECRET was ever unset/misconfigured
// in an environment, anyone reading the source could forge valid tokens for any user id.
// Fail fast instead of silently signing with a known-weak default.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required and must not use the old hardcoded default.');
}

const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    JWT_SECRET as string,
    { expiresIn: '30d' }
  );
};

// SECURITY FIX: self-service registration must never be able to grant privileged roles.
// Only 'student' and 'parent' may be self-assigned; teacher/admin require a trusted
// provisioning path that does not exist via this public endpoint yet.
const SELF_SERVICE_ROLES = ['student', 'parent'];

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, parentEmail, childEmails } = req.body;
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    const sanitizedParentEmail = parentEmail ? parentEmail.trim().toLowerCase() : null;

    if (!sanitizedEmail || !sanitizedEmail.endsWith('@gmail.com')) {
      res.status(400).json({
        success: false,
        message: 'Only @gmail.com email addresses are allowed.',
      });
      return;
    }

    if (role !== undefined && role !== null && role !== '' && !SELF_SERVICE_ROLES.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Self-registration only supports roles: ${SELF_SERVICE_ROLES.join(', ')}. Teacher/admin accounts must be provisioned by an administrator.`,
      });
      return;
    }
    const safeRole = SELF_SERVICE_ROLES.includes(role) ? role : 'student';

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
        role: safeRole,
        parent_email: safeRole === 'student' ? sanitizedParentEmail : null,
        child_emails: safeRole === 'parent' ? childEmails : null,
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

    if (!sanitizedEmail || !sanitizedEmail.endsWith('@gmail.com')) {
      res.status(400).json({ success: false, message: 'Only @gmail.com email addresses are allowed.' });
      return;
    }

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

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Email and name are required' });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail.endsWith('@gmail.com')) {
      res.status(400).json({ success: false, message: 'Only @gmail.com email addresses are allowed.' });
      return;
    }

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
    const { email, password } = req.body;
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    if (!sanitizedEmail || !sanitizedEmail.endsWith('@gmail.com')) {
      res.status(400).json({ success: false, message: 'Only @gmail.com email addresses are allowed.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (findError || !user) {
      res.status(404).json({ success: false, message: 'User not found with this @gmail.com address.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      res.status(500).json({ success: false, message: 'Failed to update password in database.' });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully! You can now log in.',
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
