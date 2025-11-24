import { Router, Request, Response } from 'express';
import { validationResult, body, param } from 'express-validator';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  validateYouTubeUrl,
  extractVideoId,
  getVideoMetadata,
  searchYouTubeVideos
} from '../services/youtube.js';
import { queueNotification } from '../services/notificationGrouping.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

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
        throw new Error('Invalid YouTube URL. Please use a valid format like: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID');
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
router.post('/', uploadLimiter, authenticateToken, validateVideoCreation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Extract the first error message for a more user-friendly response
      const firstError = errors.array()[0];
      res.status(400).json({ 
        error: 'Validation failed', 
        message: firstError.msg || 'Invalid input',
        details: errors.array() 
      });
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

    // Check if THIS USER has already shared this video (PRD: prevent same user from sharing duplicate)
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('id, user_id, title')
      .eq('youtube_video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (existingVideo) {
      res.status(409).json({ 
        error: 'Video already shared',
        message: 'You have already shared this YouTube video on Petflix',
        video_id: existingVideo.id
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
        // view_count will use database default (0) if column exists
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
      // Check for specific database errors
      if (insertError?.code === '23505') { // Unique constraint violation (user trying to share same video twice)
        res.status(409).json({ 
          error: 'Video already shared',
          message: 'You have already shared this YouTube video on Petflix'
        });
        return;
      }
      res.status(500).json({ 
        error: 'Failed to share video',
        message: insertError?.message || 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? insertError : undefined
      });
      return;
    }

    // Send push notifications to followers
    try {
      // Get user's username
      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      if (user) {
        // Get all followers
        const { data: followers } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId);

        // Notify each follower
        if (followers && followers.length > 0) {
          const notifyPromises = followers.map(follower =>
            queueNotification(follower.follower_id, 'video', {
              username: user.username,
              videoTitle: newVideo.title,
              videoId: newVideo.id,
              userId: userId,
            })
          );
          await Promise.all(notifyPromises);
        }
      }
    } catch (notifError) {
      console.error('Failed to send video notifications:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: 'Video shared successfully',
      video: newVideo
    });
  } catch (error: any) {
    console.error('Share video error:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while sharing the video',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// GET /api/v1/videos/search - Search Petflix's shared videos (query optional - can browse all)
router.get('/search', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, sort, page, limit: limitParam } = req.query;

    const sortOption = (sort as string) || 'relevance'; // Default to relevance
    const hasQuery = q && typeof q === 'string' && q.trim().length > 0;
    const searchTerm = hasQuery ? `%${q}%` : null; // For ILIKE pattern matching
    
    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const pageSize = Math.min(parseInt(limitParam as string) || 20, 100); // Max 100 per page
    const offset = (pageNum - 1) * pageSize;

    // Build query - if no search query, get all videos
    let videosQuery = supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        view_count,
        user_id,
        users!videos_user_id_fkey (
          id,
          username,
          profile_picture_url
        )
      `, { count: 'exact' }); // Get total count for pagination

    // Apply search filter only if query exists
    if (hasQuery && searchTerm) {
      videosQuery = videosQuery.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Apply pagination
    const { data: videos, error, count } = await videosQuery
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
      return;
    }

    // Fetch engagement metrics and sort based on sort option
    let videosWithMetrics = await Promise.all((videos || []).map(async (video: any) => {
      const user = Array.isArray(video.users) ? video.users[0] : video.users;
      
      // Get engagement metrics (PRD: likes, comments, shares)
      const { count: likesCount } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);

      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);

      // Get share count (sum of click_count from shareable_urls for this video)
      const { data: shareableUrls } = await supabase
        .from('shareable_urls')
        .select('click_count')
        .eq('video_id', video.id);
      
      const sharesCount = shareableUrls?.reduce((sum, url) => sum + (url.click_count || 0), 0) || 0;

      // Engagement = likes + comments + shares (per PRD requirement)
      const engagement = (likesCount || 0) + (commentsCount || 0) + sharesCount;

      return {
        id: video.id,
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        description: video.description,
        thumbnail_url: `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`,
        created_at: video.created_at,
        view_count: video.view_count || 0,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        engagement: engagement,
        user: {
          id: user.id,
          username: user.username,
          profile_picture_url: user.profile_picture_url
        }
      };
    }));

    // Sort based on sort option
    switch (sortOption) {
      case 'recency':
        videosWithMetrics.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'view_count':
        videosWithMetrics.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'engagement':
        videosWithMetrics.sort((a, b) => b.engagement - a.engagement);
        break;
      case 'relevance':
      default:
        // Calculate relevance scores and sort
        const { calculateRelevanceScore, getRelevanceWeights } = await import('../services/relevanceAlgorithm.js');
        const weights = await getRelevanceWeights();
        
        const videosWithRelevance = await Promise.all(
          videosWithMetrics.map(video => 
            calculateRelevanceScore(video, hasQuery ? (q as string) : '', weights)
          )
        );
        
        // Sort by relevance score (highest first)
        videosWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Replace videosWithMetrics with relevance-sorted videos
        videosWithMetrics = videosWithRelevance;
        break;
    }

    // Format the response (include relevance score if sorting by relevance)
    const formattedVideos = videosWithMetrics.map((video: any) => ({
      id: video.id,
      youtube_video_id: video.youtube_video_id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      created_at: video.created_at,
      user: video.user,
      ...(sortOption === 'relevance' && video.relevanceScore !== undefined && {
        relevance_score: Math.round(video.relevanceScore * 100) / 100, // Round to 2 decimals
      }),
    }));

    // Track search history (async, don't wait for it) - only if there was a query
    const userId = req.userId || null;
    if (userId && hasQuery && q) {
      // Fire and forget - don't wait for it
      supabase
        .from('search_history')
        .insert({
          user_id: userId,
          search_query: q as string,
          search_results_count: formattedVideos.length
        })
        .then(() => {
          // Success - no need to log
        })
        .catch(err => {
          console.error('Failed to track search history:', err);
        });
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      videos: formattedVideos,
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
    console.error('Search videos error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to search videos'
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
        view_count,
        user_id,
        users!user_id (
          username,
          profile_picture_url
        )
      `)
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('Video fetch error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if it's a "not found" error or a different error
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Video not found' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to fetch video',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      return;
    }

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Track view with 24-hour cooldown per user/IP (YouTube-like behavior)
    const userId = req.userId || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    // Check if this user/IP has viewed this video in the last 24 hours
    (async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        // Check for recent view by this user or IP
        let recentViewQuery = supabase
          .from('video_views')
          .select('id')
          .eq('video_id', videoId)
          .gte('viewed_at', twentyFourHoursAgo)
          .limit(1);

        // Check by user_id if logged in, otherwise by IP
        if (userId) {
          recentViewQuery = recentViewQuery.eq('user_id', userId);
        } else if (ipAddress) {
          recentViewQuery = recentViewQuery.eq('ip_address', ipAddress);
        } else {
          // No way to identify user, skip tracking
          return;
        }

        const { data: recentView, error: checkError } = await recentViewQuery.single();

        // If table doesn't exist, skip gracefully
        if (checkError && checkError.code === '42P01') {
          return;
        }

        // If user/IP has viewed recently, don't count again
        if (recentView) {
          console.log(`👁️ View not counted - user/IP viewed within last 24h`);
          return;
        }

        // No recent view found, increment counter and record view
        console.log(`👁️ Counting new view for video ${videoId}`);

        // Try to increment view count using RPC function (if it exists)
        const { error: rpcError } = await supabase.rpc('increment_video_view', { video_id_param: videoId });
        
        // RPC function might not exist if migrations haven't been run - that's okay
        if (rpcError && rpcError.code !== '42883') { // 42883 = function does not exist
          // Fallback: fetch, increment, update (only if view_count column exists)
          const { data, error: selectError } = await supabase
            .from('videos')
            .select('view_count')
            .eq('id', videoId)
            .single();
            
          if (selectError) {
            // Column might not exist - that's okay, just skip view tracking
            return;
          }
          
          if (data) {
            await supabase
              .from('videos')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('id', videoId);
          }
        }

        // Record individual view for analytics
        const { error: insertError } = await supabase
          .from('video_views')
          .insert({
            video_id: videoId,
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent
          });
        
        if (insertError && insertError.code !== '42P01') {
          console.warn('Failed to record video view:', insertError);
        }
      } catch (err: any) {
        // Silently fail - view tracking is optional
        if (err.code !== '42883' && err.code !== '42P01') {
          console.warn('Failed to track view:', err);
        }
      }
    })();

    // Flatten the response to match frontend expectations
    // Handle case where users join might return null (user deleted) or array
    const user = Array.isArray((video as any).users) 
      ? (video as any).users[0] 
      : (video as any).users;
    
    const formattedVideo = {
      id: video.id,
      youtube_video_id: video.youtube_video_id,
      title: video.title,
      description: video.description,
      created_at: video.created_at,
      shared_by_user_id: video.user_id,
      username: user?.username || null,
      profile_picture_url: user?.profile_picture_url || null,
      view_count: (video as any).view_count || 0
    };

    res.status(200).json(formattedVideo);
  } catch (error: any) {
    console.error('Get video error:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch video details',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
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

// POST /api/v1/videos/:videoId/share-url - Generate unique trackable share URL
router.post('/:videoId/share-url', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Check video exists
    const { data: video } = await supabase
      .from('videos')
      .select('id, user_id')
      .eq('id', videoId)
      .single();

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Generate unique share code (8 characters, alphanumeric)
    const shareCode = crypto.randomBytes(4).toString('base64')
      .replace(/[+/=]/g, '')
      .substring(0, 8)
      .toUpperCase();

    // Check if share code already exists (unlikely but handle it)
    let finalShareCode = shareCode;
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('shareable_urls')
        .select('id')
        .eq('share_code', finalShareCode)
        .single();

      if (!existing) break;
      
      finalShareCode = crypto.randomBytes(4).toString('base64')
        .replace(/[+/=]/g, '')
        .substring(0, 8)
        .toUpperCase();
      attempts++;
    }

    // Create shareable URL record
    const { data: shareableUrl, error: insertError } = await supabase
      .from('shareable_urls')
      .insert({
        video_id: videoId,
        share_code: finalShareCode
      })
      .select()
      .single();

    if (insertError || !shareableUrl) {
      console.error('Share URL creation error:', insertError);
      res.status(500).json({ error: 'Failed to generate share URL' });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${frontendUrl}/s/${finalShareCode}`;

    res.status(201).json({
      message: 'Share URL generated successfully',
      share_url: shareUrl,
      share_code: finalShareCode,
      video_id: videoId
    });
  } catch (error) {
    console.error('Generate share URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos/share/:shareCode - Redirect to video via share code
router.get('/share/:shareCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareCode } = req.params;

    if (!shareCode || shareCode.length !== 8) {
      res.status(400).json({ error: 'Invalid share code format' });
      return;
    }

    // Find shareable URL
    const { data: shareableUrl, error } = await supabase
      .from('shareable_urls')
      .select('video_id, click_count')
      .eq('share_code', shareCode.toUpperCase())
      .single();

    if (error || !shareableUrl) {
      res.status(404).json({ error: 'Share link not found or invalid' });
      return;
    }

    // Increment click count
    await supabase
      .from('shareable_urls')
      .update({ click_count: (shareableUrl.click_count || 0) + 1 })
      .eq('share_code', shareCode.toUpperCase());

    // Redirect to video page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(302, `${frontendUrl}/video/${shareableUrl.video_id}`);
  } catch (error) {
    console.error('Share redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos/:videoId/share-stats - Get share URL stats (video owner only)
router.get('/:videoId/share-stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId!;

    // Check video exists and belongs to user
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', videoId)
      .single();

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (video.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only view stats for your own videos'
      });
      return;
    }

    // Get all shareable URLs for this video
    const { data: shareableUrls, error } = await supabase
      .from('shareable_urls')
      .select('id, share_code, click_count, created_at')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Share stats error:', error);
      res.status(500).json({ error: 'Failed to fetch share stats' });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stats = (shareableUrls || []).map(url => ({
      share_code: url.share_code,
      share_url: `${frontendUrl}/s/${url.share_code}`,
      click_count: url.click_count || 0,
      created_at: url.created_at
    }));

    res.status(200).json({
      video_id: videoId,
      total_clicks: stats.reduce((sum, s) => sum + s.click_count, 0),
      share_urls: stats
    });
  } catch (error) {
    console.error('Share stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/videos/trending - Get trending videos
router.get('/trending', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 12 } = req.query;
    const hoursAgo = 24; // Trending based on last 24 hours

    // Get videos with engagement metrics from last 24 hours
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        created_at,
        view_count,
        user_id,
        users:user_id (
          username,
          profile_picture_url
        )
      `)
      .gte('created_at', new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString())
      .order('view_count', { ascending: false })
      .limit(Number(limit));

    if (error) {
      console.error('Error fetching trending videos:', error);
      res.status(500).json({ error: 'Failed to fetch trending videos' });
      return;
    }

    // Calculate trending score: view velocity + engagement
    const videosWithScore = await Promise.all((videos || []).map(async (video: any) => {
      // Get views in last 24 hours
      const { count: recentViews } = await supabase
        .from('video_views')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id)
        .gte('viewed_at', new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString());

      // Get likes count
      const { count: likesCount } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);

      // Calculate trending score: view velocity (recent views) + engagement (likes + comments)
      const viewVelocity = recentViews || 0;
      const engagement = (likesCount || 0) + (commentsCount || 0);
      const trendingScore = viewVelocity * 2 + engagement; // Weight view velocity more

      return {
        ...video,
        trending_score: trendingScore,
        recent_views: recentViews || 0,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0
      };
    }));

    // Sort by trending score
    videosWithScore.sort((a, b) => b.trending_score - a.trending_score);

    // Flatten the response
    const formattedVideos = videosWithScore.map((video: any) => {
      const user = video.users;
      return {
        id: video.id,
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        description: video.description,
        created_at: video.created_at,
        shared_by_user_id: video.user_id,
        username: user?.username || null,
        profile_picture_url: user?.profile_picture_url || null,
        view_count: video.view_count || 0
      };
    });

    res.status(200).json({ videos: formattedVideos });
  } catch (error) {
    console.error('Get trending videos error:', error);
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
        view_count,
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

// GET /api/v1/videos/search/youtube - Search YouTube videos
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

