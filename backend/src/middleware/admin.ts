import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from './auth.js';

/**
 * Middleware to check if user is an administrator
 * Must be used after authenticateToken
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First ensure user is authenticated
    if (!req.userId) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource' 
      });
      return;
    }

    // Check if user is admin
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      console.error('Admin check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify admin status' 
      });
      return;
    }

    if (!user.is_admin) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'Administrator access required' 
      });
      return;
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify admin status' 
    });
  }
};

/**
 * Combined middleware: authenticate + require admin
 */
export const authenticateAdmin = [
  authenticateToken,
  requireAdmin
];

