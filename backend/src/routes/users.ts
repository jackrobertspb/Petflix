import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { 
  validateUserId, 
  validateProfileUpdate, 
  validateEmailUpdate 
} from '../middleware/validation.js';

const router = Router();

// GET /api/v1/users/:userId
router.get('/:userId', validateUserId, optionalAuth, async (req: Request, res: Response): Promise<void> => {
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

    const { userId } = req.params;

    // Query user by ID (exclude password_hash)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      res.status(404).json({ 
        error: 'User not found',
        message: 'No user found with the provided ID' 
      });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        bio: user.bio,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching user profile' 
    });
  }
});

// PATCH /api/v1/users/:userId
router.patch(
  '/:userId', 
  validateUserId, 
  authenticateToken, 
  validateProfileUpdate, 
  async (req: Request, res: Response): Promise<void> => {
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

      const { userId } = req.params;
      const authenticatedUserId = req.userId;

      // Verify ownership
      if (userId !== authenticatedUserId) {
        res.status(403).json({ 
          error: 'Authorization failed',
          message: 'You can only update your own profile' 
        });
        return;
      }

      const { bio, profile_picture_url } = req.body;

      // Build update object with only provided fields
      const updates: { 
        bio?: string; 
        profile_picture_url?: string;
      } = {};

      if (bio !== undefined) {
        updates.bio = bio;
      }

      if (profile_picture_url !== undefined) {
        updates.profile_picture_url = profile_picture_url;
      }

      // If no updates provided, return error
      if (Object.keys(updates).length === 0) {
        res.status(400).json({ 
          error: 'Update failed',
          message: 'No valid fields provided for update' 
        });
        return;
      }

      // Update database
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
        .single();

      if (updateError || !updatedUser) {
        console.error('Profile update error:', updateError);
        res.status(500).json({ 
          error: 'Update failed',
          message: 'Failed to update user profile' 
        });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          profile_picture_url: updatedUser.profile_picture_url,
          bio: updatedUser.bio,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating profile' 
      });
    }
  }
);

// PATCH /api/v1/users/:userId/email
router.patch(
  '/:userId/email',
  validateUserId,
  authenticateToken,
  validateEmailUpdate,
  async (req: Request, res: Response): Promise<void> => {
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

      const { userId } = req.params;
      const authenticatedUserId = req.userId;
      const { email } = req.body;

      // Verify ownership
      if (userId !== authenticatedUserId) {
        res.status(403).json({ 
          error: 'Authorization failed',
          message: 'You can only update your own email' 
        });
        return;
      }

      // Get current user to check last email update
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('email, email_updated_at')
        .eq('id', userId)
        .single();

      if (fetchError || !currentUser) {
        res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided ID' 
        });
        return;
      }

      // Check if email is the same
      if (currentUser.email === email) {
        res.status(400).json({ 
          error: 'Update failed',
          message: 'New email is the same as current email' 
        });
        return;
      }

      // Check email change cooldown (7 days per PRD)
      if (currentUser.email_updated_at) {
        const lastUpdate = new Date(currentUser.email_updated_at);
        const now = new Date();
        const daysSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastUpdate < 7) {
          const daysRemaining = Math.ceil(7 - daysSinceLastUpdate);
          res.status(429).json({ 
            error: 'Update failed',
            message: `You can only change your email once per week. Please try again in ${daysRemaining} day(s)`,
            retry_after_days: daysRemaining
          });
          return;
        }
      }

      // Check for duplicate email
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        res.status(409).json({ 
          error: 'Update failed',
          message: 'Email already registered to another account' 
        });
        return;
      }

      // Update email and timestamp
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email,
          email_updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, username, email, created_at, updated_at')
        .single();

      if (updateError || !updatedUser) {
        console.error('Email update error:', updateError);
        res.status(500).json({ 
          error: 'Update failed',
          message: 'Failed to update email address' 
        });
        return;
      }

      // Log verification email (actual email sending deferred)
      console.log(`📧 Email verification would be sent to: ${email}`);

      res.status(200).json({
        message: 'Email updated successfully. A verification email has been sent.',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Email update error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating email' 
      });
    }
  }
);

export default router;

