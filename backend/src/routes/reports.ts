import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

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

// GET /api/v1/reports - Get reported videos (Admin only)
router.get('/', authenticateToken, requireAdmin, [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const status = (req.query.status as string) || 'pending';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('reported_videos')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    // Get paginated reports
    const { data: reports, error } = await supabase
      .from('reported_videos')
      .select(`
        id,
        video_id,
        reporter_id,
        reason,
        status,
        created_at,
        reviewed_at,
        reviewed_by,
        videos:video_id (
          id,
          youtube_video_id,
          title,
          description,
          user_id,
          users:user_id (
            id,
            username
          )
        ),
        reporter:reporter_id (
          id,
          username
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
      return;
    }

    res.status(200).json({
      reports: reports || [],
      pagination: {
        current_page: page,
        per_page: limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/reports/:reportId/approve - Approve a report (Admin action)
router.patch('/:reportId/approve', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const reviewerId = req.userId!;

    if (!reportId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }

    // Check report exists and is pending
    const { data: report } = await supabase
      .from('reported_videos')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (report.status !== 'pending') {
      res.status(400).json({ 
        error: 'Invalid operation',
        message: 'This report has already been reviewed'
      });
      return;
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('reported_videos')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError || !updatedReport) {
      console.error('Approve report error:', updateError);
      res.status(500).json({ error: 'Failed to approve report' });
      return;
    }

    res.status(200).json({
      message: 'Report approved successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Approve report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/reports/:reportId/reject - Reject a report (Admin action)
router.patch('/:reportId/reject', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const reviewerId = req.userId!;

    if (!reportId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }

    // Check report exists and is pending
    const { data: report } = await supabase
      .from('reported_videos')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (report.status !== 'pending') {
      res.status(400).json({ 
        error: 'Invalid operation',
        message: 'This report has already been reviewed'
      });
      return;
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('reported_videos')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError || !updatedReport) {
      console.error('Reject report error:', updateError);
      res.status(500).json({ error: 'Failed to reject report' });
      return;
    }

    res.status(200).json({
      message: 'Report rejected successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Reject report error:', error);
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

