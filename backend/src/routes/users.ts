import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
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
      .select('id, username, email, profile_picture_url, bio, user_number, created_at, updated_at')
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
        user_number: user.user_number,
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
    console.log('📸 Profile picture upload request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation failed:', errors.array());
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;
    const authenticatedUserId = req.userId;
    console.log('👤 User ID from params:', userId, 'Authenticated user:', authenticatedUserId);

    // Verify ownership
    if (userId !== authenticatedUserId) {
      console.error('❌ Authorization failed: userId mismatch');
      res.status(403).json({ 
        error: 'Authorization failed',
        message: 'You can only update your own profile' 
      });
      return;
    }

    // Check if file was uploaded
    if (!req.body.image || !req.body.imageType) {
      console.error('❌ Missing file data - image:', !!req.body.image, 'imageType:', !!req.body.imageType);
      res.status(400).json({ 
        error: 'Missing file',
        message: 'No image provided' 
      });
      return;
    }

    const imageData = req.body.image; // Base64 encoded image
    const imageType = req.body.imageType; // e.g., 'image/jpeg', 'image/png'
    console.log('📷 Image type:', imageType, 'Image data length:', imageData?.length || 0);
    
    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageType)) {
      console.error('❌ Invalid image type:', imageType);
      res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed' 
      });
      return;
    }

    // Convert base64 to buffer
    console.log('🔄 Converting base64 to buffer...');
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Buffer created, size:', buffer.length, 'bytes');
    } catch (bufferError: any) {
      console.error('❌ Failed to create buffer:', bufferError);
      res.status(400).json({ 
        error: 'Invalid image data',
        message: 'Failed to process image data' 
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      console.error('❌ File too large:', buffer.length, 'bytes (max:', maxSize, ')');
      res.status(400).json({ 
        error: 'File too large',
        message: 'Profile picture must be less than 5MB' 
      });
      return;
    }

    // Content moderation check
    console.log('🔍 Running image moderation...');
    try {
      const { moderateProfilePicture } = await import('../services/imageModeration.js');
      const moderationResult = await moderateProfilePicture(buffer, imageType);
      console.log('✅ Moderation result:', { approved: moderationResult.approved, reason: moderationResult.reason });
      
      if (!moderationResult.approved) {
        console.error('❌ Image moderation failed:', moderationResult.reason);
        res.status(400).json({ 
          error: 'Image moderation failed',
          message: moderationResult.reason || 'Image did not pass moderation checks'
        });
        return;
      }

      // Log warnings if any (but don't block upload)
      if (moderationResult.warnings && moderationResult.warnings.length > 0) {
        console.log(`⚠️ Profile picture moderation warnings for user ${userId}:`, moderationResult.warnings);
      }
    } catch (moderationError: any) {
      console.error('❌ Image moderation error:', moderationError);
      // Don't fail upload if moderation service is down, but log it
      console.warn('⚠️ Continuing without moderation due to error');
    }

    // Determine file extension
    const extension = imageType.split('/')[1] === 'jpeg' ? 'jpg' : imageType.split('/')[1];
    const fileName = `${userId}/profile-picture.${extension}`;
    console.log('📁 File name:', fileName);

    // Upload to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage bucket: profile-pictures');
    
    // First, verify bucket is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
    } else {
      const bucketExists = buckets?.some(b => b.name === 'profile-pictures');
      console.log('🔍 Bucket exists check:', bucketExists ? '✅ Found' : '❌ Not found');
      if (!bucketExists) {
        console.error('❌ Bucket "profile-pictures" not found. Available buckets:', buckets?.map(b => b.name));
      }
    }
    
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, buffer, {
        contentType: imageType,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('❌ Supabase storage upload error:', uploadError);
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        name: uploadError.name
      });
      
      // Provide more helpful error messages
      let userMessage = uploadError.message || 'Failed to upload profile picture to storage';
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        userMessage = 'Storage bucket not found. Please contact support.';
      } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('access')) {
        userMessage = 'Permission denied. Please check storage bucket permissions.';
      } else if (uploadError.message?.includes('policy') || uploadError.message?.includes('RLS')) {
        userMessage = 'Storage policy error. Please check bucket policies.';
      }
      
      res.status(500).json({ 
        error: 'Upload failed',
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? uploadError : undefined
      });
      return;
    }
    console.log('✅ File uploaded to Supabase Storage');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const baseUrl = urlData.publicUrl;
    console.log('🔗 Base Public URL:', baseUrl);

    // Update user profile with new picture URL (store base URL without timestamp)
    console.log('💾 Updating user profile in database...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: baseUrl })
      .eq('id', userId)
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      console.error('❌ Profile update error:', updateError);
      console.error('❌ Update error details:', {
        message: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint
      });
      res.status(500).json({ 
        error: 'Update failed',
        message: updateError?.message || 'Failed to update profile picture URL',
        details: updateError
      });
      return;
    }
    console.log('✅ Profile updated successfully');

    // Return URL with cache-busting timestamp for immediate refresh
    const urlWithCacheBust = `${baseUrl}?t=${Date.now()}`;
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: urlWithCacheBust, // Return with timestamp for immediate refresh
      user: {
        ...updatedUser,
        profile_picture_url: urlWithCacheBust // Also include in user object
      }
    });
  } catch (error: any) {
    console.error('❌ Profile picture upload error (catch block):', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      console.log('💾 Profile update request received');
      console.log('📦 Request body:', req.body);
      
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation failed:', errors.array());
        res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
        return;
      }

      const { userId } = req.params;
      const authenticatedUserId = req.userId;
      console.log('👤 User ID from params:', userId, 'Authenticated user:', authenticatedUserId);

      // Verify ownership
      if (userId !== authenticatedUserId) {
        console.error('❌ Authorization failed: userId mismatch');
        res.status(403).json({ 
          error: 'Authorization failed',
          message: 'You can only update your own profile' 
        });
        return;
      }

      const { bio, profile_picture_url } = req.body;
      console.log('📝 Update fields - bio:', bio, 'profile_picture_url:', profile_picture_url);

      // Build update object with only provided, non-empty fields
      const updates: { 
        bio?: string; 
        profile_picture_url?: string;
      } = {};

      // Only add bio if it's defined and not an empty string (allow empty string to clear bio)
      if (bio !== undefined && bio !== null) {
        updates.bio = bio.trim(); // Trim whitespace, empty string is valid to clear bio
        console.log('✅ Adding bio to updates:', updates.bio);
      }

      // Only add profile_picture_url if it's defined, not null, and not empty string
      if (profile_picture_url !== undefined && profile_picture_url !== null && profile_picture_url !== '') {
        updates.profile_picture_url = profile_picture_url.trim();
        console.log('✅ Adding profile_picture_url to updates');
      }

      // If no updates provided, return error
      if (Object.keys(updates).length === 0) {
        console.error('❌ No valid fields provided for update');
        res.status(400).json({ 
          error: 'Update failed',
          message: 'No valid fields provided for update' 
        });
        return;
      }

      console.log('💾 Updating database with:', updates);

      // Update database
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
        .single();

      if (updateError || !updatedUser) {
        console.error('❌ Profile update error:', updateError);
        console.error('❌ Update error details:', {
          message: updateError?.message,
          code: updateError?.code,
          details: updateError?.details,
          hint: updateError?.hint
        });
        res.status(500).json({ 
          error: 'Update failed',
          message: updateError?.message || 'Failed to update user profile',
          details: updateError
        });
        return;
      }

      console.log('✅ Profile updated successfully:', updatedUser);
      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error: any) {
      console.error('❌ Profile update error (catch block):', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// PATCH /api/v1/users/:userId/email - Update email (no verification required)
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

      // Update email directly (no verification required)
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          email: email,
          email_updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, username, email, profile_picture_url, bio')
        .single();

      if (updateError) {
        console.error('Email update error:', updateError);
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to update email address' 
        });
        return;
      }

      res.status(200).json({
        message: 'Email address updated successfully.',
        user: updatedUser
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
