import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

const validatePlaylistCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Playlist name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Playlist name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either "public" or "private"')
];

const validatePlaylistUpdate = [
  param('playlistId').isUUID().withMessage('Invalid playlist ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Playlist name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Visibility must be either "public" or "private"')
];

// POST /api/v1/playlists - Create a playlist
router.post('/', authenticateToken, validatePlaylistCreation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { name, description, visibility = 'private' } = req.body;
    const userId = req.userId!;

    // Check for duplicate playlist name for this user
    const { data: existingPlaylist } = await supabase
      .from('playlists')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (existingPlaylist) {
      res.status(409).json({ 
        error: 'Playlist already exists',
        message: 'You already have a playlist with this name'
      });
      return;
    }

    // Create playlist
    const { data: newPlaylist, error: insertError } = await supabase
      .from('playlists')
      .insert({
        name,
        description: description || null,
        visibility,
        user_id: userId
      })
      .select()
      .single();

    if (insertError || !newPlaylist) {
      console.error('Playlist creation error:', insertError);
      res.status(500).json({ error: 'Failed to create playlist' });
      return;
    }

    res.status(201).json({
      message: 'Playlist created successfully',
      playlist: newPlaylist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/:playlistId - Get playlist details
router.get('/:playlistId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const requestingUserId = req.userId;

    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid playlist ID format' });
      return;
    }

    // Get playlist with user info
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        description,
        visibility,
        user_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq('id', playlistId)
      .single();

    if (error || !playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Check if private playlist and user is not the owner
    if (playlist.visibility === 'private' && playlist.user_id !== requestingUserId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'This playlist is private'
      });
      return;
    }

    // Get videos in the playlist
    const { data: playlistVideos, error: videosError } = await supabase
      .from('playlist_videos')
      .select(`
        created_at,
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
      .order('created_at', { ascending: true });

    if (videosError) {
      console.error('Get playlist videos error:', videosError);
    }

    res.status(200).json({
      playlist: {
        ...playlist,
        videos: playlistVideos?.map(pv => pv.videos) || []
      }
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/search - Search public playlists
router.get('/search', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page, limit: limitParam } = req.query;
    const requestingUserId = req.userId;

    const hasQuery = q && typeof q === 'string' && q.trim().length > 0;
    const searchTerm = hasQuery ? `%${q}%` : null;
    
    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const pageSize = Math.min(parseInt(limitParam as string) || 20, 100);
    const offset = (pageNum - 1) * pageSize;

    if (!hasQuery) {
      res.status(400).json({ 
        error: 'Query required',
        message: 'Search query is required' 
      });
      return;
    }

    // Build query for public playlists (or user's own playlists)
    let playlistsQuery = supabase
      .from('playlists')
      .select(`
        id,
        name,
        description,
        visibility,
        user_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `, { count: 'exact' })
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);

    // Only show public playlists, or user's own playlists if authenticated
    if (requestingUserId) {
      // Show public playlists OR user's own playlists (regardless of visibility)
      // Use a filter that allows public OR (user_id matches AND any visibility)
      playlistsQuery = playlistsQuery.or(`visibility.eq.public,user_id.eq.${requestingUserId}`);
    } else {
      playlistsQuery = playlistsQuery.eq('visibility', 'public');
    }

    const { data: playlists, error, count } = await playlistsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Playlist search error:', error);
      res.status(500).json({ error: 'Search failed' });
      return;
    }

    // Get video counts for each playlist
    const playlistsWithCounts = await Promise.all((playlists || []).map(async (playlist: any) => {
      const { count: videoCount } = await supabase
        .from('playlist_videos')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlist.id);

      return {
        ...playlist,
        video_count: videoCount || 0
      };
    }));

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      playlists: playlistsWithCounts,
      pagination: {
        current_page: pageNum,
        per_page: pageSize,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    });
  } catch (error) {
    console.error('Playlist search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/playlists/user/:userId - Get user's playlists
router.get('/user/:userId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    // Check if user exists
    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userExists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Build query - show only public playlists unless viewing own profile
    let query = supabase
      .from('playlists')
      .select('id, name, description, visibility, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // If not the owner, only show public playlists
    if (userId !== requestingUserId) {
      query = query.eq('visibility', 'public');
    }

    const { data: playlists, error } = await query;

    if (error) {
      console.error('Get user playlists error:', error);
      res.status(500).json({ error: 'Failed to fetch playlists' });
      return;
    }

    // Get video counts and latest video thumbnail for each playlist
    const playlistsWithCounts = await Promise.all(
      (playlists || []).map(async (playlist) => {
        const { count } = await supabase
          .from('playlist_videos')
          .select('*', { count: 'exact', head: true })
          .eq('playlist_id', playlist.id);
        
        // Get the latest video thumbnail
        const { data: latestVideo } = await supabase
          .from('playlist_videos')
          .select('videos(youtube_video_id)')
          .eq('playlist_id', playlist.id)
          .order('added_at', { ascending: false })
          .limit(1)
          .single();
        
        const latestVideoThumbnail = latestVideo?.videos?.youtube_video_id 
          ? `https://img.youtube.com/vi/${latestVideo.videos.youtube_video_id}/mqdefault.jpg`
          : null;
        
        return {
          ...playlist,
          video_count: count || 0,
          latest_video_thumbnail: latestVideoThumbnail
        };
      })
    );

    res.status(200).json({ 
      playlists: playlistsWithCounts,
      count: playlistsWithCounts.length
    });
  } catch (error) {
    console.error('Get user playlists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/playlists/:playlistId - Update playlist
router.patch('/:playlistId', authenticateToken, validatePlaylistUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { playlistId } = req.params;
    const { name, description, visibility } = req.body;
    const userId = req.userId!;

    // Check playlist exists and belongs to user
    const { data: existingPlaylist } = await supabase
      .from('playlists')
      .select('user_id, name')
      .eq('id', playlistId)
      .single();

    if (!existingPlaylist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (existingPlaylist.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only edit your own playlists'
      });
      return;
    }

    // Build update object
    const updates: { name?: string; description?: string; visibility?: string } = {};
    if (name !== undefined) {
      // Check for duplicate name (if changing name)
      if (name !== existingPlaylist.name) {
        const { data: duplicateName } = await supabase
          .from('playlists')
          .select('id')
          .eq('user_id', userId)
          .eq('name', name)
          .neq('id', playlistId)
          .single();

        if (duplicateName) {
          res.status(409).json({ 
            error: 'Name already exists',
            message: 'You already have a playlist with this name'
          });
          return;
        }
      }
      updates.name = name;
    }
    if (description !== undefined) updates.description = description;
    if (visibility !== undefined) updates.visibility = visibility;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Update playlist
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', playlistId)
      .select()
      .single();

    if (updateError || !updatedPlaylist) {
      console.error('Playlist update error:', updateError);
      res.status(500).json({ error: 'Failed to update playlist' });
      return;
    }

    res.status(200).json({
      message: 'Playlist updated successfully',
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/playlists/:playlistId - Delete playlist
router.delete('/:playlistId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const userId = req.userId!;

    if (!playlistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid playlist ID format' });
      return;
    }

    // Check playlist exists and belongs to user
    const { data: existingPlaylist } = await supabase
      .from('playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (!existingPlaylist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (existingPlaylist.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own playlists'
      });
      return;
    }

    // Delete playlist (cascade will handle playlist_videos and playlist_tags)
    const { error: deleteError } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (deleteError) {
      console.error('Playlist deletion error:', deleteError);
      res.status(500).json({ error: 'Failed to delete playlist' });
      return;
    }

    res.status(200).json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

