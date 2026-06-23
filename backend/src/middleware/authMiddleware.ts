import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient';

export interface IUser {
  _id: string; // mapped from id for compatibility
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  parentEmail?: string;
  childEmails?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plis_super_secret_jwt_key_2026_safe_and_secure') as { id: string };

      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !dbUser) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      // Map snake_case database fields to camelCase models
      req.user = {
        _id: dbUser.id,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        parentEmail: dbUser.parent_email,
        childEmails: dbUser.child_emails,
      };

      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'Guest'}) is not authorized to access this resource`,
      });
      return;
    }
    next();
  };
};
