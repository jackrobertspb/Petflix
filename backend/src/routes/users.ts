import { Router, Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProfileUpdate, validateEmailUpdate, validatePasswordChange } from '../middleware/validation.js';

const router = Router();

const validateUserId = [
  param('userId').isUUID().withMessage('Invalid user ID')
];

// GET /api/v1/users/:userId - Get user profile
router.get('/:userId', validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/users/:userId/profile-picture - Upload profile picture
router.post('/:userId/profile-picture', authenticateToken, validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
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

    // Check if file was uploaded
    if (!req.body.image || !req.body.imageType) {
      res.status(400).json({ 
        error: 'Missing file',
        message: 'No image provided' 
      });
      return;
    }

    const imageData = req.body.image; // Base64 encoded image
    const imageType = req.body.imageType; // e.g., 'image/jpeg', 'image/png'
    
    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageType)) {
      res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed' 
      });
      return;
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      res.status(400).json({ 
        error: 'File too large',
        message: 'Profile picture must be less than 5MB' 
      });
      return;
    }

    // Content moderation check
    const { moderateProfilePicture } = await import('../services/imageModeration.js');
    const moderationResult = await moderateProfilePicture(buffer, imageType);
    
    if (!moderationResult.approved) {
      res.status(400).json({ 
        error: 'Image moderation failed',
        message: moderationResult.reason || 'Image did not pass moderation checks'
      });
      return;
    }

    // Log warnings if any (but don't block upload)
    if (moderationResult.warnings && moderationResult.warnings.length > 0) {
      console.log(`Profile picture moderation warnings for user ${userId}:`, moderationResult.warnings);
    }

    // Determine file extension
    const extension = imageType.split('/')[1] === 'jpeg' ? 'jpg' : imageType.split('/')[1];
    const fileName = `${userId}/profile-picture.${extension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, buffer, {
        contentType: imageType,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Profile picture upload error:', uploadError);
      res.status(500).json({ 
        error: 'Upload failed',
        message: 'Failed to upload profile picture' 
      });
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update user profile with new picture URL
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId)
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      console.error('Profile update error:', updateError);
      res.status(500).json({ 
        error: 'Update failed',
        message: 'Failed to update profile picture URL' 
      });
      return;
    }

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: publicUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        user: updatedUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/v1/users/:userId/email - Update email (requires verification)
router.patch(
  '/:userId/email',
  validateUserId,
  authenticateToken,
  validateEmailUpdate,
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

      // Import email service dynamically to avoid circular dependencies
      const { sendEmailVerificationEmail } = await import('../services/email.js');

      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        res.status(409).json({ 
          error: 'Email already in use',
          message: 'This email address is already registered to another account' 
        });
        return;
      }

      // Check if user updated email in last 7 days (cooldown)
      const { data: currentUser } = await supabase
        .from('users')
        .select('email, updated_at')
        .eq('id', userId)
        .single();

      if (currentUser && currentUser.email !== email) {
        const lastUpdate = currentUser.updated_at ? new Date(currentUser.updated_at) : null;
        if (lastUpdate) {
          const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate < 7) {
            const daysRemaining = Math.ceil(7 - daysSinceUpdate);
            res.status(429).json({ 
              error: 'Email update cooldown',
              message: `You can only update your email once every 7 days. Please try again in ${daysRemaining} day(s).` 
            });
            return;
          }
        }
      }

      // Generate verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Store token in database (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: userId,
          new_email: email,
          token: verificationToken,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        console.error('Token creation error:', tokenError);
        res.status(500).json({ 
          error: 'Verification failed',
          message: 'Failed to create verification token' 
        });
        return;
      }

      // Send verification email
      try {
        await sendEmailVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails - token is still created
      }

      res.status(200).json({
        message: 'A verification email has been sent to your new email address. Please check your inbox and click the verification link to complete the email update.',
        verification_required: true
      });
    } catch (error) {
      console.error('Email update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/v1/users/:userId/password - Change password
router.patch(
  '/:userId/password',
  validateUserId,
  authenticateToken,
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
      const authenticatedUserId = req.userId;
      const { currentPassword, newPassword } = req.body;

      // Verify ownership
      if (userId !== authenticatedUserId) {
        res.status(403).json({ 
          error: 'Authorization failed',
          message: 'You can only change your own password' 
        });
        return;
      }

      // Get user's current password hash
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const bcrypt = await import('bcrypt');
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
          error: 'Update failed',
          message: 'Failed to update password' 
        });
        return;
      }

      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/v1/users/:userId - Delete user account
router.delete('/:userId', validateUserId, authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;
    const authenticatedUserId = req.userId;

    // Verify ownership
    if (userId !== authenticatedUserId) {
      res.status(403).json({ 
        error: 'Authorization failed',
        message: 'You can only delete your own account' 
      });
      return;
    }

    // Delete user (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Account deletion error:', deleteError);
      res.status(500).json({ 
        error: 'Deletion failed',
        message: 'Failed to delete account' 
      });
      return;
    }

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
