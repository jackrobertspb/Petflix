import { Router, Request, Response } from 'express';
import { validationResult, body, param } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  validateYouTubeUrl,
  extractVideoId,
  getVideoMetadata,
  searchYouTubeVideos
} from '../services/youtube.js';

const router = Router();

// Validation rules
const validateVideoCreation = [
  body('youtubeUrl')
    .trim()
    .notEmpty()
    .withMessage('YouTube URL is required')
    .custom((value) => {
      const result = validateYouTubeUrl(value);
      if (!result.valid) {
        throw new Error('Invalid YouTube URL or video ID');
      }
      return true;
    }),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters')
];

const validateVideoUpdate = [
  param('videoId').isUUID().withMessage('Invalid video ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters')
];

// POST /api/v1/videos - Share a YouTube video
router.post('/', authenticateToken, validateVideoCreation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { youtubeUrl, title, description } = req.body;
    const userId = req.userId!;

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      res.status(400).json({ error: 'Invalid YouTube URL', message: 'Could not extract video ID' });
      return;
    }

    // Fetch metadata from YouTube
    const metadata = await getVideoMetadata(videoId);
    if (!metadata) {
      res.status(404).json({ 
        error: 'Video not found',
        message: 'YouTube video not found or is unavailable'
      });
      return;
    }

    // Create video record
    const { data: newVideo, error: insertError } = await supabase
      .from('videos')
      .insert({
        youtube_video_id: videoId,
        title: title || metadata.title,
        description: description || metadata.description,
        user_id: userId
      })
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at
      `)
      .single();

    if (insertError || !newVideo) {
      console.error('Video creation error:', insertError);
      res.status(500).json({ error: 'Failed to share video' });
      return;
    }

    res.status(201).json({
      message: 'Video shared successfully',
      video: newVideo
    });
  } catch (error) {
    console.error('Share video error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while sharing the video'
    });
  }
});

// GET /api/v1/videos/:videoId - Get video details
router.get('/:videoId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        updated_at,
        user_id,
        users!user_id (
          username,
          profile_picture_url
        )
      `)
      .eq('id', videoId)
      .single();

    if (error || !video) {
      console.error('Video fetch error:', error);
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Flatten the response to match frontend expectations
    const user = (video as any).users;
    const formattedVideo = {
      id: video.id,
      youtube_video_id: video.youtube_video_id,
      title: video.title,
      description: video.description,
      created_at: video.created_at,
      shared_by_user_id: video.user_id,
      username: user?.username || null,
      profile_picture_url: user?.profile_picture_url || null
    };

    res.status(200).json(formattedVideo);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/videos/:videoId - Edit video
router.patch('/:videoId', authenticateToken, validateVideoUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.userId!;

    // Check video exists and belongs to user
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single();

    if (!existingVideo) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (existingVideo.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only edit your own videos'
      });
      return;
    }

    // Build update object
    const updates: { title?: string; description?: string } = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Update video
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single();

    if (updateError || !updatedVideo) {
      console.error('Video update error:', updateError);
      res.status(500).json({ error: 'Failed to update video' });
      return;
    }

    res.status(200).json({
      message: 'Video updated successfully',
      video: updatedVideo
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/videos/:videoId - Delete video
router.delete('/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    // Check video exists and belongs to user
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single();

    if (!existingVideo) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (existingVideo.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own videos'
      });
      return;
    }

    // Delete video
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteError) {
      console.error('Video deletion error:', deleteError);
      res.status(500).json({ error: 'Failed to delete video' });
      return;
    }

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos - Get all videos (for feed)
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        user_id,
        users:user_id (
          username,
          profile_picture_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
      return;
    }

    // Flatten the response for frontend
    const formattedVideos = videos?.map((video: any) => {
      const user = video.users;
      return {
        id: video.id,
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        description: video.description,
        created_at: video.created_at,
        shared_by_user_id: video.user_id,
        username: user?.username || null,
        profile_picture_url: user?.profile_picture_url || null
      };
    }) || [];

    res.status(200).json({ videos: formattedVideos });
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos/user/:userId - Get videos by user
router.get('/user/:userId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        user_id,
        users:user_id (
          username,
          profile_picture_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
      return;
    }

    // Flatten the response for frontend
    const formattedVideos = videos?.map((video: any) => {
      const user = video.users;
      return {
        id: video.id,
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        description: video.description,
        created_at: video.created_at,
        shared_by_user_id: video.user_id,
        username: user?.username || null,
        profile_picture_url: user?.profile_picture_url || null
      };
    }) || [];

    res.status(200).json({ videos: formattedVideos });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos/search - Search YouTube videos
router.get('/search/youtube', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, maxResults, pageToken } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query (q) is required' });
      return;
    }

    const max = maxResults && typeof maxResults === 'string' ? parseInt(maxResults, 10) : 10;
    const token = pageToken && typeof pageToken === 'string' ? pageToken : undefined;

    const results = await searchYouTubeVideos(q, max, token);

    res.status(200).json(results);
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: 'Failed to search YouTube videos'
    });
  }
});

// GET /api/v1/videos/user/:userId - Get videos shared by a user
router.get('/user/:userId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user videos error:', error);
      res.status(500).json({ error: 'Failed to fetch user videos' });
      return;
    }

    res.status(200).json({ videos: videos || [] });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

