import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/v1/comment-likes/:commentId - Like a comment
router.post('/:commentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId!;

    if (!commentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid comment ID format' });
      return;
    }

    // Check if comment exists
    const { data: commentExists } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (!commentExists) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check if user already liked this comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single();

    if (existingLike) {
      res.status(409).json({ error: 'You have already liked this comment' });
      return;
    }

    // Create like
    const { error: insertError } = await supabase
      .from('comment_likes')
      .insert({
        user_id: userId,
        comment_id: commentId
      });

    if (insertError) {
      console.error('Comment like error:', insertError);
      res.status(500).json({ error: 'Failed to like comment' });
      return;
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    res.status(201).json({ 
      message: 'Comment liked successfully',
      liked: true,
      like_count: count || 0
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/comment-likes/:commentId - Unlike a comment
router.delete('/:commentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId!;

    if (!commentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid comment ID format' });
      return;
    }

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single();

    if (!existingLike) {
      res.status(404).json({ error: 'Like not found' });
      return;
    }

    // Delete like
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('Comment unlike error:', deleteError);
      res.status(500).json({ error: 'Failed to unlike comment' });
      return;
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    res.status(200).json({ 
      message: 'Comment unliked successfully',
      liked: false,
      like_count: count || 0
    });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/comment-likes/:commentId - Get like status and count for a comment
router.get('/:commentId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId; // Optional - may be undefined if not authenticated

    if (!commentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid comment ID format' });
      return;
    }

    // Get like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    // Check if current user liked this comment (if authenticated)
    let userLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
        .from('comment_likes')
        .select('user_id')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .single();
      
      userLiked = !!userLike;
    }

    res.status(200).json({
      comment_id: commentId,
      like_count: count || 0,
      user_liked: userLiked
    });
  } catch (error) {
    console.error('Get comment likes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/comment-likes/video/:videoId/batch - Get like info for all comments in a video
router.get('/video/:videoId/batch', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Get all comments for this video
    const { data: comments } = await supabase
      .from('comments')
      .select('id')
      .eq('video_id', videoId);

    if (!comments || comments.length === 0) {
      res.status(200).json({ likes: {} });
      return;
    }

    const commentIds = comments.map(c => c.id);

    // Get all likes for these comments
    const { data: allLikes } = await supabase
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds);

    // Count likes per comment
    const likeCounts: Record<string, number> = {};
    const userLikes: Record<string, boolean> = {};

    commentIds.forEach(id => {
      likeCounts[id] = 0;
      userLikes[id] = false;
    });

    allLikes?.forEach(like => {
      likeCounts[like.comment_id] = (likeCounts[like.comment_id] || 0) + 1;
      if (userId && like.user_id === userId) {
        userLikes[like.comment_id] = true;
      }
    });

    // Format response
    const result: Record<string, { like_count: number; user_liked: boolean }> = {};
    commentIds.forEach(id => {
      result[id] = {
        like_count: likeCounts[id],
        user_liked: userLikes[id]
      };
    });

    res.status(200).json({ likes: result });
  } catch (error) {
    console.error('Get batch comment likes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

