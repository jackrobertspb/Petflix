import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const validateAddVideo = [
  param('playlistId').isUUID().withMessage('Invalid playlist ID'),
  body('video_id').isUUID().withMessage('Invalid video ID')
];

// POST /api/v1/playlists/:playlistId/videos - Add video to playlist
router.post('/:playlistId/videos', authenticateToken, validateAddVideo, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { playlistId } = req.params;
    const { video_id } = req.body;
    const userId = req.userId!;

    // Check playlist exists and belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only add videos to your own playlists'
      });
      return;
    }

    // Check video exists
    const { data: video } = await supabase
      .from('videos')
      .select('id')
      .eq('id', video_id)
      .single();

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Check if video already in playlist
    const { data: existingVideo } = await supabase
      .from('playlist_videos')
      .select('playlist_id')
      .eq('playlist_id', playlistId)
      .eq('video_id', video_id)
      .single();

    if (existingVideo) {
      res.status(409).json({ 
        error: 'Video already in playlist',
        message: 'This video is already in the playlist'
      });
      return;
    }

    // Get the next position (highest position + 1)
    const { data: lastVideo } = await supabase
      .from('playlist_videos')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = lastVideo ? (lastVideo.position || 0) + 1 : 0;

    // Add video to playlist with position
    const { data: newEntry, error: insertError } = await supabase
      .from('playlist_videos')
      .insert({
        playlist_id: playlistId,
        video_id,
        position: nextPosition
      })
      .select()
      .single();

    if (insertError || !newEntry) {
      console.error('Add video to playlist error:', insertError);
      res.status(500).json({ error: 'Failed to add video to playlist' });
      return;
    }

    res.status(201).json({
      message: 'Video added to playlist successfully',
      playlist_video: newEntry
    });
  } catch (error) {
    console.error('Add video to playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/playlists/:playlistId/videos/:videoId - Remove video from playlist
router.delete('/:playlistId/videos/:videoId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId, videoId } = req.params;
    const userId = req.userId!;

    // Validate UUIDs
    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
        !videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    // Check playlist exists and belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only remove videos from your own playlists'
      });
      return;
    }

    // Check if video is in playlist
    const { data: existingVideo } = await supabase
      .from('playlist_videos')
      .select('playlist_id')
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
      .single();

    if (!existingVideo) {
      res.status(404).json({ 
        error: 'Video not in playlist',
        message: 'This video is not in the playlist'
      });
      return;
    }

    // Remove video from playlist
    const { error: deleteError } = await supabase
      .from('playlist_videos')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId);

    if (deleteError) {
      console.error('Remove video from playlist error:', deleteError);
      res.status(500).json({ error: 'Failed to remove video from playlist' });
      return;
    }

    res.status(200).json({ message: 'Video removed from playlist successfully' });
  } catch (error) {
    console.error('Remove video from playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/:playlistId/videos - Get all videos in a playlist
router.get('/:playlistId/videos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;

    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid playlist ID format' });
      return;
    }

    // Get videos with tags and position
    const { data: playlistVideos, error } = await supabase
      .from('playlist_videos')
      .select(`
        created_at,
        position,
        video_id,
        videos:video_id (
          id,
          youtube_video_id,
          title,
          description,
          users:user_id (
            id,
            username,
            profile_picture_url
          )
        )
      `)
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Get playlist videos error:', error);
      res.status(500).json({ error: 'Failed to fetch playlist videos' });
      return;
    }

    // Get tags for these videos
    const videoIds = playlistVideos?.map(pv => pv.video_id) || [];
    const { data: tags } = await supabase
      .from('playlist_tags')
      .select('video_id, tag_name')
      .eq('playlist_id', playlistId)
      .in('video_id', videoIds);

    // Group tags by video_id
    const tagsByVideo = new Map<string, string[]>();
    tags?.forEach(tag => {
      if (!tagsByVideo.has(tag.video_id)) {
        tagsByVideo.set(tag.video_id, []);
      }
      tagsByVideo.get(tag.video_id)!.push(tag.tag_name);
    });

    // Add tags to videos
    const videosWithTags = playlistVideos?.map(pv => ({
      ...pv.videos,
      tags: tagsByVideo.get(pv.video_id) || [],
      added_at: pv.created_at
    }));

    res.status(200).json({ 
      videos: videosWithTags || [],
      count: videosWithTags?.length || 0
    });
  } catch (error) {
    console.error('Get playlist videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/playlists/:playlistId/videos/reorder - Reorder videos in playlist
router.patch('/:playlistId/videos/reorder', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const { video_orders } = req.body; // Array of { video_id, position }
    const userId = req.userId!;

    if (!Array.isArray(video_orders) || video_orders.length === 0) {
      res.status(400).json({ 
        error: 'Validation failed',
        message: 'video_orders must be a non-empty array of { video_id, position } objects'
      });
      return;
    }

    // Validate playlist exists and belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only reorder videos in your own playlists'
      });
      return;
    }

    // Update positions for each video
    const updatePromises = video_orders.map(({ video_id, position }: { video_id: string; position: number }) => {
      if (typeof position !== 'number' || position < 0) {
        throw new Error(`Invalid position for video ${video_id}`);
      }
      return supabase
        .from('playlist_videos')
        .update({ position })
        .eq('playlist_id', playlistId)
        .eq('video_id', video_id);
    });

    await Promise.all(updatePromises);

    res.status(200).json({ 
      message: 'Playlist videos reordered successfully'
    });
  } catch (error: any) {
    console.error('Reorder playlist videos error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to reorder playlist videos'
    });
  }
});

export default router;

