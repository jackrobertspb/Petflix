import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { 
  validateUserId, 
  validateProfileUpdate, 
  validateEmailUpdate,
  validatePasswordChange
} from '../middleware/validation.js';
import { sendEmailVerificationEmail } from '../services/email.js';
import bcrypt from 'bcrypt';

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

      // Check for duplicate email (silently - don't reveal if email exists for security)
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        // SECURITY: Don't reveal that email is registered to prevent enumeration attacks
        res.status(400).json({ 
          error: 'Update failed',
          message: 'Unable to update email address. Please try again or contact support.' 
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

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

      // Save verification token (don't update email yet - wait for verification)
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: userId,
          new_email: email,
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        console.error('Failed to create verification token:', tokenError);
        // Rollback email update
        await supabase
          .from('users')
          .update({ email: currentUser.email, email_updated_at: currentUser.email_updated_at })
          .eq('id', userId);
        
        res.status(500).json({ 
          error: 'Update failed',
          message: 'Failed to create verification token' 
        });
        return;
      }

      // Send verification email (async, don't wait for it)
      sendEmailVerificationEmail(email, currentUser.username, verificationToken).catch(err => {
        console.error('Failed to send verification email:', err);
        // Don't fail request if email fails
      });

      // In development, also log to console for testing
      if (process.env.NODE_ENV === 'development') {
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        console.log('📧 EMAIL VERIFICATION REQUESTED');
        console.log(`📧 User: ${currentUser.email} (@${currentUser.username})`);
        console.log(`📧 New Email: ${email}`);
        console.log(`🔗 Verification Link: ${verificationLink}`);
        console.log(`⏰ Expires: ${expiresAt.toISOString()}`);
      }

      // Don't actually update email yet - wait for verification
      // Revert the email update
      await supabase
        .from('users')
        .update({ email: currentUser.email, email_updated_at: currentUser.email_updated_at })
        .eq('id', userId);

      res.status(200).json({
        message: 'A verification email has been sent to your new email address. Please verify to complete the change.',
        // Include in dev mode for testing
        ...(process.env.NODE_ENV === 'development' && { 
          verificationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
        })
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

// PATCH /api/v1/users/:userId/password - Change password
router.patch(
  '/:userId/password',
  authenticateToken,
  validateUserId,
  validatePasswordChange,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
        return;
      }

      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;
      const requestingUserId = req.userId!;

      // Only allow users to change their own password
      if (requestingUserId !== userId) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only change your own password'
        });
        return;
      }

      // Get current password hash
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided ID' 
        });
        return;
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ 
          error: 'Invalid password',
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId);

      if (updateError) {
        console.error('Password update error:', updateError);
        res.status(500).json({ 
          error: 'Failed to update password',
          message: 'An error occurred while updating password'
        });
        return;
      }

      res.status(200).json({
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while changing password' 
      });
    }
  }
);

// DELETE /api/v1/users/:userId - Delete account
router.delete(
  '/:userId',
  authenticateToken,
  validateUserId,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
        return;
      }

      const { userId } = req.params;
      const requestingUserId = req.userId!;

      // Only allow users to delete their own account
      if (requestingUserId !== userId) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only delete your own account'
        });
        return;
      }

      // Check if user exists
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        res.status(404).json({ 
          error: 'User not found',
          message: 'No user found with the provided ID' 
        });
        return;
      }

      // Delete user (CASCADE will handle related records)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Account deletion error:', deleteError);
        res.status(500).json({ 
          error: 'Failed to delete account',
          message: 'An error occurred while deleting account'
        });
        return;
      }

      res.status(200).json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting account' 
      });
    }
  }
);

// PATCH /api/v1/users/:userId/admin - Assign/remove admin role (Admin only)
router.patch('/:userId/admin', authenticateToken, requireAdmin, validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
      return;
    }

    const { userId } = req.params;
    const { is_admin } = req.body;

    if (typeof is_admin !== 'boolean') {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'is_admin must be a boolean value'
      });
      return;
    }

    // Prevent removing your own admin status
    if (userId === req.userId && is_admin === false) {
      res.status(400).json({ 
        error: 'Invalid operation',
        message: 'You cannot remove your own admin privileges'
      });
      return;
    }

    // Check if target user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, is_admin')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      res.status(404).json({ 
        error: 'User not found',
        message: 'No user found with the provided ID' 
      });
      return;
    }

    // Update admin status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_admin })
      .eq('id', userId)
      .select('id, username, is_admin')
      .single();

    if (updateError || !updatedUser) {
      console.error('Admin assignment error:', updateError);
      res.status(500).json({ 
        error: 'Failed to update admin status',
        message: 'An error occurred while updating admin status'
      });
      return;
    }

    res.status(200).json({
      message: `Admin status ${is_admin ? 'granted' : 'revoked'} successfully`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        is_admin: updatedUser.is_admin
      }
    });
  } catch (error) {
    console.error('Admin assignment error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred' 
    });
  }
});

export default router;

