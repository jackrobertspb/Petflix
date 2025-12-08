import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { queueNotification } from '../services/notificationGrouping.js';
import { checkVideoAvailability } from '../services/youtube.js';

const router = Router();

/**
 * Helper function to check and update video availability in the background
 * Only checks videos that haven't been checked in the last 24 hours
 */
async function checkAndUpdateAvailability(videoId: string, youtubeVideoId: string, lastCheck: string | null) {
  try {
    // Skip if checked within last 24 hours
    if (lastCheck) {
      const lastCheckTime = new Date(lastCheck).getTime();
      const now = Date.now();
      const hoursSinceCheck = (now - lastCheckTime) / (1000 * 60 * 60);
      
      if (hoursSinceCheck < 24) {
        return; // Skip - recently checked
      }
    }

    // Check availability on YouTube
    const isAvailable = await checkVideoAvailability(youtubeVideoId);
    
    // Update database
    await supabase
      .from('videos')
      .update({
        is_available: isAvailable,
        last_availability_check: new Date().toISOString()
      })
      .eq('id', videoId);

    if (!isAvailable) {
      console.log(`📹 Video ${youtubeVideoId} marked as unavailable`);
    }
  } catch (error) {
    console.error(`Error checking availability for video ${videoId}:`, error);
    // Silently fail - don't block the request
  }
}

const validateUserId = [
  param('userId').isUUID().withMessage('Invalid user ID')
];

// POST /api/v1/follows/:userId - Follow a user
router.post('/:userId', authenticateToken, validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId: followingId } = req.params;
    const followerId = req.userId!;

    // Prevent self-following
    if (followerId === followingId) {
      res.status(400).json({ 
        error: 'Invalid operation',
        message: 'You cannot follow yourself'
      });
      return;
    }

    // Check if user to follow exists
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', followingId)
      .single();

    if (!userExists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existingFollow) {
      res.status(409).json({ 
        error: 'Already following',
        message: 'You are already following this user'
      });
      return;
    }

    // Create follow relationship
    console.log('🔄 Attempting to create follow:', {
      follower_id: followerId,
      following_id: followingId
    });

    const { data: newFollow, error: insertError } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followingId
      })
      .select()
      .single();

    if (insertError || !newFollow) {
      console.error('❌ Follow creation error:', insertError);
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
      res.status(500).json({ 
        error: 'Failed to follow user',
        message: insertError?.message || 'Unknown error',
        details: insertError?.details || insertError?.hint || null
      });
      return;
    }

    console.log('✅ Follow created successfully:', newFollow);

    // Send push notification to the user being followed
    try {
      const { data: followerUser } = await supabase
        .from('users')
        .select('username')
        .eq('id', followerId)
        .single();

      if (followerUser) {
        await queueNotification(followingId, 'follow', {
          username: followerUser.username,
          followerId: followerId,
        });
      }
    } catch (notifError) {
      console.error('Failed to send follow notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: 'Successfully followed user',
      follow: {
        follower_id: newFollow.follower_id,
        following_id: newFollow.following_id,
        created_at: newFollow.created_at
      }
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/follows/:userId - Unfollow a user
router.delete('/:userId', authenticateToken, validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId: followingId } = req.params;
    const followerId = req.userId!;

    // Check if following relationship exists
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (!existingFollow) {
      res.status(404).json({ 
        error: 'Not following',
        message: 'You are not following this user'
      });
      return;
    }

    // Delete follow relationship
    const { error: deleteError } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (deleteError) {
      console.error('Unfollow error:', deleteError);
      res.status(500).json({ error: 'Failed to unfollow user' });
      return;
    }

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/follows/:userId/followers - Get user's followers
router.get('/:userId/followers', validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;

    const { data: followers, error } = await supabase
      .from('followers')
      .select(`
        follower_id,
        created_at,
        users:follower_id (
          id,
          username,
          profile_picture_url,
          bio
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get followers error:', error);
      res.status(500).json({ error: 'Failed to fetch followers' });
      return;
    }

    res.status(200).json({ 
      followers: followers || [],
      count: followers?.length || 0
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/follows/:userId/following - Get users that a user is following
router.get('/:userId/following', validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;

    const { data: following, error } = await supabase
      .from('followers')
      .select(`
        following_id,
        created_at,
        users:following_id (
          id,
          username,
          profile_picture_url,
          bio
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get following error:', error);
      res.status(500).json({ error: 'Failed to fetch following' });
      return;
    }

    res.status(200).json({ 
      following: following || [],
      count: following?.length || 0
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/follows/:userId/feed - Get feed of videos from followed users
router.get('/:userId/feed', authenticateToken, validateUserId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { userId } = req.params;
    const authenticatedUserId = req.userId!;

    // Verify the requesting user is accessing their own feed
    if (userId !== authenticatedUserId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only access your own feed'
      });
      return;
    }

    // Get users that the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      console.error('Get following error:', followingError);
      res.status(500).json({ error: 'Failed to fetch feed' });
      return;
    }

    if (!followingData || followingData.length === 0) {
      res.status(200).json({ 
        videos: [],
        message: 'Follow some users to see their videos in your feed'
      });
      return;
    }

    const followingIds = followingData.map(f => f.following_id);

    // Get videos from followed users
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        user_id,
        is_available,
        last_availability_check,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .in('user_id', followingIds)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (videosError) {
      console.error('Get feed videos error:', videosError);
      res.status(500).json({ error: 'Failed to fetch feed' });
      return;
    }

    // Send response immediately
    res.status(200).json({ 
      videos: videos || [],
      count: videos?.length || 0
    });

    // Check availability in background (don't await - fire and forget)
    videos?.forEach((video: any) => {
      checkAndUpdateAvailability(video.id, video.youtube_video_id, video.last_availability_check).catch(err => {
        // Silently fail - already logged in the function
      });
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

