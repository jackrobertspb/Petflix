import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const validateAddTag = [
  param('playlistId').isUUID().withMessage('Invalid playlist ID'),
  param('videoId').isUUID().withMessage('Invalid video ID'),
  body('tag_name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Tag name can only contain letters, numbers, hyphens, and underscores')
];

// POST /api/v1/playlists/:playlistId/videos/:videoId/tags - Add tag to video in playlist
router.post('/:playlistId/videos/:videoId/tags', authenticateToken, validateAddTag, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { playlistId, videoId } = req.params;
    const { tag_name } = req.body;
    const userId = req.userId!;

    // Check playlist belongs to user
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
        message: 'You can only tag videos in your own playlists'
      });
      return;
    }

    // Check video is in playlist
    const { data: videoInPlaylist } = await supabase
      .from('playlist_videos')
      .select('playlist_id')
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
      .single();

    if (!videoInPlaylist) {
      res.status(404).json({ 
        error: 'Video not found',
        message: 'Video is not in this playlist'
      });
      return;
    }

    // Check if tag already exists for this video in this playlist
    const { data: existingTag } = await supabase
      .from('playlist_tags')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
      .eq('tag_name', tag_name)
      .single();

    if (existingTag) {
      res.status(409).json({ 
        error: 'Tag already exists',
        message: 'This tag already exists for this video in this playlist'
      });
      return;
    }

    // Add tag
    const { data: newTag, error: insertError } = await supabase
      .from('playlist_tags')
      .insert({
        playlist_id: playlistId,
        video_id: videoId,
        tag_name
      })
      .select()
      .single();

    if (insertError || !newTag) {
      console.error('Add tag error:', insertError);
      res.status(500).json({ error: 'Failed to add tag' });
      return;
    }

    res.status(201).json({
      message: 'Tag added successfully',
      tag: newTag
    });
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/playlists/:playlistId/videos/:videoId/tags/:tagName - Remove tag from video
router.delete('/:playlistId/videos/:videoId/tags/:tagName', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId, videoId, tagName } = req.params;
    const userId = req.userId!;

    // Validate UUIDs
    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
        !videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    // Check playlist belongs to user
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
        message: 'You can only remove tags from your own playlists'
      });
      return;
    }

    // Check tag exists
    const { data: existingTag } = await supabase
      .from('playlist_tags')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
      .eq('tag_name', tagName)
      .single();

    if (!existingTag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    // Delete tag
    const { error: deleteError } = await supabase
      .from('playlist_tags')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
      .eq('tag_name', tagName);

    if (deleteError) {
      console.error('Remove tag error:', deleteError);
      res.status(500).json({ error: 'Failed to remove tag' });
      return;
    }

    res.status(200).json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/:playlistId/tags - Get all tags used in a playlist
router.get('/:playlistId/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;

    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid playlist ID format' });
      return;
    }

    // Get all unique tags in this playlist
    const { data: tags, error } = await supabase
      .from('playlist_tags')
      .select('tag_name')
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Get tags error:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
      return;
    }

    // Get unique tag names
    const uniqueTags = [...new Set(tags?.map(t => t.tag_name) || [])];

    res.status(200).json({ 
      tags: uniqueTags,
      count: uniqueTags.length
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/:playlistId/videos/filter - Filter videos by tag
router.get('/:playlistId/videos/filter', [
  param('playlistId').isUUID(),
  query('tag').notEmpty()
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { playlistId } = req.params;
    const { tag } = req.query;

    // Get video IDs with this tag
    const { data: taggedVideos, error: tagsError } = await supabase
      .from('playlist_tags')
      .select('video_id')
      .eq('playlist_id', playlistId)
      .eq('tag_name', tag as string);

    if (tagsError) {
      console.error('Filter by tag error:', tagsError);
      res.status(500).json({ error: 'Failed to filter videos' });
      return;
    }

    if (!taggedVideos || taggedVideos.length === 0) {
      res.status(200).json({ videos: [], count: 0 });
      return;
    }

    const videoIds = taggedVideos.map(tv => tv.video_id);

    // Get video details
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .in('id', videoIds);

    if (videosError) {
      console.error('Get filtered videos error:', videosError);
      res.status(500).json({ error: 'Failed to fetch videos' });
      return;
    }

    res.status(200).json({ 
      videos: videos || [],
      count: videos?.length || 0,
      filtered_by_tag: tag
    });
  } catch (error) {
    console.error('Filter videos by tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

