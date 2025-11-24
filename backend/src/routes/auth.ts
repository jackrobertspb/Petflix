import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validateRegistration, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
      return;
    }

    const { username, email, password } = req.body;

    // Check for duplicate username
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      res.status(409).json({ 
        error: 'Registration failed',
        message: 'Username already taken' 
      });
      return;
    }

    // Check for duplicate email (silently - don't reveal if email exists for security)
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      // SECURITY: Don't reveal that email is registered to prevent enumeration attacks
      res.status(400).json({ 
        error: 'Registration failed',
        message: 'Unable to complete registration. Please check your information and try again.' 
      });
      return;
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash
      })
      .select('id, username, email, created_at')
      .single();

    if (insertError || !newUser) {
      console.error('User creation error:', insertError);
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'Failed to create user account' 
      });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: newUser.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(email, username).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail registration if email fails
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred during registration' 
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
      return;
    }

    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Find user by email (include locking fields)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, created_at, failed_login_attempts, locked_until')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.error('❌ Database fetch error:', fetchError);
      console.error('❌ This might mean the failed_login_attempts or locked_until columns do not exist!');
      console.error('❌ Please run the SQL migration: ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0, ADD COLUMN locked_until TIMESTAMP;');
    }

    if (fetchError || !user) {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('📊 Current failed attempts:', user.failed_login_attempts || 0);
    console.log('🔒 Locked until:', user.locked_until || 'Not locked');

    // Check if account is locked
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until);
      const now = new Date();
      
      if (now < lockExpiry) {
        const minutesRemaining = Math.ceil((lockExpiry.getTime() - now.getTime()) / (1000 * 60));
        res.status(403).json({ 
          error: 'Account locked',
          message: `Too many failed login attempts. Account locked for ${minutesRemaining} more minute(s). Please try again later or reset your password.`
        });
        return;
      } else {
        // Lock has expired, reset it
        await supabase
          .from('users')
          .update({ 
            failed_login_attempts: 0,
            locked_until: null
          })
          .eq('id', user.id);
      }
    }

    // Compare password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const updateData: any = {
        failed_login_attempts: newAttempts
      };

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes
        updateData.locked_until = lockUntil.toISOString();
        
        console.log('🔒 LOCKING ACCOUNT:', email);
        console.log('🔒 Lock until:', lockUntil.toISOString());
        
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        console.log('✅ Account locked successfully');

        res.status(403).json({ 
          error: 'Account locked',
          message: 'Too many failed login attempts. Your account has been locked for 30 minutes. Please reset your password or try again later.'
        });
        return;
      }

      console.log(`⚠️ Failed attempt ${newAttempts}/5 for ${email}`);

      // Update failed attempts count
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      const attemptsRemaining = 5 - newAttempts;
      res.status(401).json({ 
        error: 'Authentication failed',
        message: `Invalid email or password. ${attemptsRemaining} attempt(s) remaining before account lock.`
      });
      return;
    }

    // Successful login - reset failed attempts
    await supabase
      .from('users')
      .update({ 
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq('id', user.id);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred during login' 
    });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'Email is required' 
      });
      return;
    }

    // Find user by email (don't reveal if user exists - security)
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
      return;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    // Save token to database
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to create reset token:', insertError);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to process password reset request' 
      });
      return;
    }

    // Send password reset email (async, don't wait for it)
    sendPasswordResetEmail(user.email, user.username, token).catch(err => {
      console.error('Failed to send password reset email:', err);
      // Don't fail request if email fails
    });

    // In development, also log to console for testing
    if (process.env.NODE_ENV === 'development') {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      console.log('🔑 PASSWORD RESET REQUESTED');
      console.log(`📧 User: ${user.email} (@${user.username})`);
      console.log(`🔗 Reset Link: ${resetLink}`);
      console.log(`⏰ Expires: ${expiresAt.toISOString()}`);
    }

    res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Include in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { 
        resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
      })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'Token and new password are required' 
      });
      return;
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'Password must be at least 8 characters long' 
      });
      return;
    }

    // Find valid, unused, non-expired token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (tokenError || !resetToken) {
      res.status(400).json({ 
        error: 'Invalid token',
        message: 'Password reset link is invalid or has expired' 
      });
      return;
    }

    // Check if token is already used
    if (resetToken.used) {
      res.status(400).json({ 
        error: 'Token already used',
        message: 'This password reset link has already been used' 
      });
      return;
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      res.status(400).json({ 
        error: 'Token expired',
        message: 'Password reset link has expired. Please request a new one.' 
      });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear failed login attempts
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to reset password' 
      });
      return;
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    res.status(200).json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    });
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'Verification token is required' 
      });
      return;
    }

    // Find valid, unused, non-expired token
    const { data: verificationToken, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('id, user_id, new_email, expires_at, used')
      .eq('token', token)
      .single();

    if (tokenError || !verificationToken) {
      res.status(400).json({ 
        error: 'Invalid token',
        message: 'Email verification link is invalid or has expired' 
      });
      return;
    }

    // Check if token is already used
    if (verificationToken.used) {
      res.status(400).json({ 
        error: 'Token already used',
        message: 'This verification link has already been used' 
      });
      return;
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(verificationToken.expires_at);
    if (now > expiresAt) {
      res.status(400).json({ 
        error: 'Token expired',
        message: 'Email verification link has expired. Please request a new one.' 
      });
      return;
    }

    // Check if email is still available (might have been taken since request)
    const { data: emailExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', verificationToken.new_email)
      .single();

    if (emailExists) {
      res.status(409).json({ 
        error: 'Email already in use',
        message: 'This email address is already registered to another account' 
      });
      return;
    }

    // Update user email and timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email: verificationToken.new_email,
        email_updated_at: new Date().toISOString()
      })
      .eq('id', verificationToken.user_id);

    if (updateError) {
      console.error('Failed to update email:', updateError);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify email address' 
      });
      return;
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('id', verificationToken.id);

    res.status(200).json({
      message: 'Email address has been verified and updated successfully.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    });
  }
});

export default router;

