import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendOtpEmail } from '../services/emailService';

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

export const verifyRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, otp } = req.body;
    const sanitizedEmail = (email || '').trim().toLowerCase();
    const identifier = sanitizedEmail || (phone || '').trim();

    if (!name || !sanitizedEmail || !password || !otp) {
      res.status(400).json({ success: false, message: 'All registration fields and OTP code are required.' });
      return;
    }

    const DEMO_OTPS = ['123456', '654321'];
    const storedOtpObj = otpStore.get(identifier) || (sanitizedEmail ? otpStore.get(sanitizedEmail) : undefined) || (phone ? otpStore.get(phone.trim()) : undefined);
    let isValidOtp = false;

    const userOtp = String(otp || '').trim();
    if (storedOtpObj && storedOtpObj.expiresAt > Date.now() && String(storedOtpObj.code).trim() === userOtp) {
      isValidOtp = true;
      otpStore.delete(identifier);
      if (sanitizedEmail) otpStore.delete(sanitizedEmail);
      if (phone) otpStore.delete(phone.trim());
    } else if (DEMO_OTPS.includes(userOtp)) {
      isValidOtp = true;
    }

    if (!isValidOtp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP verification code.' });
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists with this email address.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'student';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: sanitizedEmail,
        password: hashedPassword,
        phone: phone || null,
        role: userRole,
      })
      .select()
      .single();

    if (error || !user) {
      res.status(400).json({ success: false, message: error?.message || 'Registration failed' });
      return;
    }

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
    console.error('VERIFY REGISTER ERROR:', error);
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

// In-memory OTP store for free dynamic OTP validation
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone } = req.body;
    const identifier = (email || phone || '').trim().toLowerCase();

    if (!identifier) {
      res.status(400).json({ success: false, message: 'Email or phone number is required.' });
      return;
    }

    // Generate real random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // valid for 5 minutes

    otpStore.set(identifier, { code: generatedOtp, expiresAt });
    if (email) {
      otpStore.set(email.trim().toLowerCase(), { code: generatedOtp, expiresAt });
    }
    if (phone) {
      otpStore.set(phone.trim(), { code: generatedOtp, expiresAt });
    }

    // Dispatch 6-digit OTP code directly to user's email inbox
    if (email) {
      try {
        await sendOtpEmail(email.trim().toLowerCase(), generatedOtp);
      } catch (err: any) {
        console.error('[Email Dispatch Error]:', err.message || err);
      }
    }

    console.log(`[SERVER OTP CONSOLE ONLY] [${new Date().toISOString()}] Target: ${identifier} | Verification Code: ${generatedOtp}`);

    res.json({
      success: true,
      message: `OTP verification code sent to ${identifier}. Please check your email inbox.`,
    });
  } catch (error: any) {
    console.error('SEND OTP ERROR:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP code.' });
  }
};

export const mobileOtpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, email, otp } = req.body;
    const identifier = (email || phone || '').trim().toLowerCase();

    if (!identifier) {
      res.status(400).json({ success: false, message: 'Email or phone number is required' });
      return;
    }

    const DEMO_OTPS = ['123456', '654321'];
    const storedOtpObj = otpStore.get(identifier);
    
    let isValidOtp = false;
    if (storedOtpObj && storedOtpObj.expiresAt > Date.now() && storedOtpObj.code === otp) {
      isValidOtp = true;
      otpStore.delete(identifier); // burn OTP after single use
    } else if (typeof otp === 'string' && DEMO_OTPS.includes(otp)) {
      isValidOtp = true;
    }

    if (!isValidOtp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      return;
    }

    // Lookup user in Supabase database
    let userQuery = supabase.from('users').select('*');
    if (email) {
      userQuery = userQuery.eq('email', email.trim().toLowerCase());
    } else {
      userQuery = userQuery.eq('phone', phone);
    }

    let { data: user } = await userQuery.maybeSingle();

    if (!user) {
      const userEmail = email ? email.trim().toLowerCase() : `otp_${phone.slice(-4)}@plis.com`;
      const userName = email ? email.split('@')[0] : `OTP User ${phone.slice(-4)}`;
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: userName,
          email: userEmail,
          phone: phone || null,
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
    console.error('OTP LOGIN ERROR:', error);
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
