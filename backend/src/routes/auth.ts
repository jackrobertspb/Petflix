import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

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

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      res.status(409).json({ 
        error: 'Registration failed',
        message: 'Email already registered' 
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

    // Log welcome email (actual email sending deferred)
    console.log(`📧 Welcome email would be sent to: ${email}`);

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

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, created_at')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
      return;
    }

    // Compare password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid email or password' 
      });
      return;
    }

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

export default router;

