import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const REPORT_REASONS = [
  'hate_speech',
  'inappropriate_content',
  'spam',
  'violence',
  'misleading',
  'copyright',
  'other'
];

const validateReport = [
  body('video_id').isUUID().withMessage('Invalid video ID'),
  body('reason')
    .isIn(REPORT_REASONS)
    .withMessage(`Reason must be one of: ${REPORT_REASONS.join(', ')}`),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Details must not exceed 500 characters')
];

// POST /api/v1/reports - Report a video
router.post('/', authenticateToken, validateReport, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { video_id, reason, details } = req.body;
    const reporterId = req.userId!;

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

    // Check if user already reported this video with the same reason
    const { data: existingReport } = await supabase
      .from('reported_videos')
      .select('id')
      .eq('video_id', video_id)
      .eq('reporter_id', reporterId)
      .eq('reason', reason)
      .single();

    if (existingReport) {
      res.status(409).json({ 
        error: 'Already reported',
        message: 'You have already reported this video for this reason'
      });
      return;
    }

    // Create report
    const { data: newReport, error: insertError } = await supabase
      .from('reported_videos')
      .insert({
        video_id,
        reporter_id: reporterId,
        reason: `${reason}${details ? `: ${details}` : ''}`,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError || !newReport) {
      console.error('Report creation error:', insertError);
      res.status(500).json({ error: 'Failed to submit report' });
      return;
    }

    res.status(201).json({
      message: 'Report submitted successfully. Thank you for helping keep Petflix safe.',
      report: {
        id: newReport.id,
        video_id: newReport.video_id,
        status: newReport.status,
        created_at: newReport.created_at
      }
    });
  } catch (error) {
    console.error('Report video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/reports/reasons - Get list of valid report reasons
router.get('/reasons', (_req: Request, res: Response): void => {
  res.status(200).json({
    reasons: REPORT_REASONS.map(reason => ({
      value: reason,
      label: reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }))
  });
});

export default router;

