import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { queueNotification } from '../services/notificationGrouping.js';

const router = Router();

// POST /api/v1/video-likes/:videoId - Like a video
router.post('/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Check if video exists
    const { data: videoExists } = await supabase
      .from('videos')
      .select('id')
      .eq('id', videoId)
      .single();

    if (!videoExists) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Check if user already liked this video
    const { data: existingLike } = await supabase
      .from('video_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (existingLike) {
      res.status(409).json({ error: 'You have already liked this video' });
      return;
    }

    // Create like
    const { error: insertError } = await supabase
      .from('video_likes')
      .insert({
        user_id: userId,
        video_id: videoId
      });

    if (insertError) {
      console.error('Video like error:', insertError);
      res.status(500).json({ error: 'Failed to like video' });
      return;
    }

    // Get updated like count
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    // Send push notification to video owner (if not liking own video)
    try {
      console.log('📬 [VIDEO LIKE] Starting notification process for video:', videoId);
      console.log('📬 [VIDEO LIKE] Liker user ID:', userId);
      
      const { data: video } = await supabase
        .from('videos')
        .select('user_id, title')
        .eq('id', videoId)
        .single();

      console.log('📬 [VIDEO LIKE] Video owner ID:', video?.user_id);
      console.log('📬 [VIDEO LIKE] Video title:', video?.title);

      const { data: liker } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      console.log('📬 [VIDEO LIKE] Liker username:', liker?.username);

      if (video && liker && video.user_id !== userId) {
        console.log('📬 [VIDEO LIKE] ✅ Conditions met, queueing notification');
        await queueNotification(video.user_id, 'video_like', {
          username: liker.username,
          videoTitle: video.title,
          videoId: videoId,
        });
        console.log('📬 [VIDEO LIKE] ✅ Notification queued successfully');
      } else {
        if (!video) console.log('📬 [VIDEO LIKE] ❌ Video not found');
        if (!liker) console.log('📬 [VIDEO LIKE] ❌ Liker not found');
        if (video && video.user_id === userId) console.log('📬 [VIDEO LIKE] ⚠️ User is liking their own video (no notification sent)');
      }
    } catch (notifError) {
      console.error('📬 [VIDEO LIKE] ❌ ERROR sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ 
      message: 'Video liked successfully',
      liked: true,
      like_count: count || 0
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/video-likes/:videoId - Unlike a video
router.delete('/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('video_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (!existingLike) {
      res.status(404).json({ error: 'Like not found' });
      return;
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('video_likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (deleteError) {
      console.error('Video unlike error:', deleteError);
      res.status(500).json({ error: 'Failed to unlike video' });
      return;
    }

    // Get updated like count
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    res.status(200).json({ 
      message: 'Video unliked successfully',
      liked: false,
      like_count: count || 0
    });
  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/video-likes/:videoId - Get like status and count for a video
router.get('/:videoId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId; // Optional - may be undefined if not authenticated

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Get like count
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    // Check if current user liked this video (if authenticated)
    let userLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
        .from('video_likes')
        .select('user_id')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single();
      
      userLiked = !!userLike;
    }

    res.status(200).json({
      video_id: videoId,
      like_count: count || 0,
      user_liked: userLiked
    });
  } catch (error) {
    console.error('Get video likes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

