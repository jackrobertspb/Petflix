import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { queueNotification } from '../services/notificationGrouping.js';

const router = Router();

const validateCommentCreation = [
  body('video_id').isUUID().withMessage('Invalid video ID'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 280 })
    .withMessage('Comment must be 280 characters or less. Your comment is too long!'),
  body('parent_comment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID')
];

const validateCommentUpdate = [
  param('commentId').isUUID().withMessage('Invalid comment ID'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 280 })
    .withMessage('Comment must be 280 characters or less. Your comment is too long!')
];

// POST /api/v1/comments - Create a comment
router.post('/', authenticateToken, validateCommentCreation, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { video_id, text, parent_comment_id } = req.body;
    const userId = req.userId!;

    // Check if video exists
    const { data: videoExists } = await supabase
      .from('videos')
      .select('id')
      .eq('id', video_id)
      .single();

    if (!videoExists) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // If replying to a comment, check if parent comment exists
    if (parent_comment_id) {
      const { data: parentExists } = await supabase
        .from('comments')
        .select('id, video_id')
        .eq('id', parent_comment_id)
        .single();

      if (!parentExists) {
        res.status(404).json({ error: 'Parent comment not found' });
        return;
      }

      // Ensure parent comment is on the same video
      if (parentExists.video_id !== video_id) {
        res.status(400).json({ 
          error: 'Invalid operation',
          message: 'Parent comment must be on the same video'
        });
        return;
      }
    }

    // Create comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        video_id,
        user_id: userId,
        text,
        parent_comment_id: parent_comment_id || null
      })
      .select(`
        id,
        video_id,
        user_id,
        text,
        parent_comment_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .single();

    if (insertError || !newComment) {
      console.error('Comment creation error:', insertError);
      res.status(500).json({ error: 'Failed to create comment' });
      return;
    }

    // Flatten the response for frontend
    const user = (newComment as any).users;
    const formattedComment = {
      id: newComment.id,
      video_id: newComment.video_id,
      user_id: newComment.user_id,
      content: newComment.text,
      username: user?.username || 'Unknown',
      created_at: newComment.created_at,
      parent_comment_id: newComment.parent_comment_id
    };

    // Send push notification to video owner (if not commenting on own video)
    try {
      const { data: video } = await supabase
        .from('videos')
        .select('user_id')
        .eq('id', video_id)
        .single();

      if (video && video.user_id !== userId) {
        await queueNotification(video.user_id, 'comment', {
          username: user?.username || 'Someone',
          commentText: newComment.text,
          videoId: video_id,
          commentId: newComment.id, // Add commentId for deduplication
        });
      }
    } catch (notifError) {
      console.error('Failed to send comment notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/comments/video/:videoId - Get comments for a video
router.get('/video/:videoId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;

    if (!videoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid video ID format' });
      return;
    }

    // Get all comments for the video (both top-level and replies)
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        video_id,
        user_id,
        text,
        parent_comment_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
      return;
    }

    // Flatten comments for frontend
    const formattedComments = comments?.map((comment: any) => {
      const user = comment.users;
      return {
        id: comment.id,
        video_id: comment.video_id,
        user_id: comment.user_id,
        content: comment.text,
        username: user?.username || 'Unknown',
        created_at: comment.created_at,
        parent_comment_id: comment.parent_comment_id
      };
    }) || [];

    res.status(200).json({ 
      comments: formattedComments,
      count: formattedComments.length
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/comments/:commentId - Edit a comment
router.patch('/:commentId', authenticateToken, validateCommentUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId!;

    // Check comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existingComment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (existingComment.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only edit your own comments'
      });
      return;
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', commentId)
      .select(`
        id,
        video_id,
        user_id,
        text,
        parent_comment_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .single();

    if (updateError || !updatedComment) {
      console.error('Comment update error:', updateError);
      res.status(500).json({ error: 'Failed to update comment' });
      return;
    }

    res.status(200).json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/comments/:commentId - Delete a comment
router.delete('/:commentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId!;

    if (!commentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid comment ID format' });
      return;
    }

    // Check comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existingComment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (existingComment.user_id !== userId) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own comments'
      });
      return;
    }

    // Delete comment (cascade will handle replies)
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      res.status(500).json({ error: 'Failed to delete comment' });
      return;
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

