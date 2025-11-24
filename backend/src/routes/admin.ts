// Admin routes for system configuration
import { Router, Request, Response } from 'express';
import { validationResult, body, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getRelevanceWeights, updateRelevanceWeights, RelevanceWeights } from '../services/relevanceAlgorithm.js';
import { supabase } from '../config/supabase.js';
import { getAnomalyConfig, updateAnomalyConfig } from '../services/anomalyDetection.js';
import { getStorageStats, checkStorageUsage } from '../services/storageMonitoring.js';

const router = Router();

// GET /api/v1/admin/relevance-weights - Get current relevance weights
router.get('/relevance-weights', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const weights = await getRelevanceWeights();
    res.status(200).json({ weights });
  } catch (error) {
    console.error('Failed to fetch relevance weights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/admin/relevance-weights - Update relevance weights
router.patch('/relevance-weights', 
  authenticateToken, 
  requireAdmin,
  [
    body('keywordMatch').optional().isFloat({ min: 0, max: 1 }),
    body('viewCount').optional().isFloat({ min: 0, max: 1 }),
    body('likeRatio').optional().isFloat({ min: 0, max: 1 }),
    body('recency').optional().isFloat({ min: 0, max: 1 }),
    body('engagement').optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const weights: Partial<RelevanceWeights> = req.body;
      
      // Get current weights and merge
      const currentWeights = await getRelevanceWeights();
      const updatedWeights: RelevanceWeights = {
        keywordMatch: weights.keywordMatch ?? currentWeights.keywordMatch,
        viewCount: weights.viewCount ?? currentWeights.viewCount,
        likeRatio: weights.likeRatio ?? currentWeights.likeRatio,
        recency: weights.recency ?? currentWeights.recency,
        engagement: weights.engagement ?? currentWeights.engagement,
      };

      // Validate sum equals 1.0
      const sum = Object.values(updatedWeights).reduce((s, w) => s + w, 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        res.status(400).json({ 
          error: 'Invalid weights', 
          message: `Weights must sum to 1.0 (current sum: ${sum.toFixed(2)})` 
        });
        return;
      }

      await updateRelevanceWeights(updatedWeights);
      res.status(200).json({ 
        message: 'Relevance weights updated successfully',
        weights: updatedWeights 
      });
    } catch (error: any) {
      console.error('Failed to update relevance weights:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
);

// GET /api/v1/admin/errors - Get error logs with filters
router.get('/errors',
  authenticateToken,
  requireAdmin,
  [
    query('level').optional().isIn(['error', 'warn', 'info']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('endpoint').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      const {
        level,
        page = '1',
        limit = '50',
        startDate,
        endDate,
        endpoint,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = supabase
        .from('error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (level) {
        query = query.eq('level', level);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (endpoint) {
        query = query.eq('endpoint', endpoint);
      }

      // Apply pagination
      const { data: errorLogs, error: fetchError, count } = await query
        .range(offset, offset + limitNum - 1);

      if (fetchError) {
        console.error('Failed to fetch error logs:', fetchError);
        res.status(500).json({ error: 'Failed to fetch error logs' });
        return;
      }

      // Calculate pagination metadata
      const totalPages = count ? Math.ceil(count / limitNum) : 1;

      res.status(200).json({
        errors: errorLogs || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error: any) {
      console.error('Get error logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/v1/admin/errors/stats - Get error statistics
router.get('/errors/stats',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { days = '7' } = req.query;
      const daysNum = Math.min(parseInt(days as string), 90);

      // Get error counts by level
      const { data: levelCounts, error: levelError } = await supabase
        .from('error_logs')
        .select('level')
        .gte('created_at', new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString());

      if (levelError) {
        console.error('Failed to fetch level counts:', levelError);
      }

      const countsByLevel = (levelCounts || []).reduce((acc: any, log: any) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {});

      // Get hourly error rate (last 24 hours)
      const { data: hourlyData, error: hourlyError } = await supabase
        .rpc('get_hourly_error_rate', {
          hours_back: 24
        });

      // If RPC doesn't exist, fetch raw data and process client-side
      let hourlyStats = [];
      if (hourlyError) {
        // Fallback: fetch and group manually
        const { data: recentErrors } = await supabase
          .from('error_logs')
          .select('created_at, level')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        // Group by hour
        const hourGroups: any = {};
        (recentErrors || []).forEach((log: any) => {
          const hour = new Date(log.created_at).toISOString().slice(0, 13) + ':00:00Z';
          if (!hourGroups[hour]) {
            hourGroups[hour] = { hour, error: 0, warn: 0, info: 0 };
          }
          hourGroups[hour][log.level]++;
        });

        hourlyStats = Object.values(hourGroups);
      } else {
        hourlyStats = hourlyData || [];
      }

      // Get top endpoints with errors
      const { data: endpointErrors, error: endpointError } = await supabase
        .from('error_logs')
        .select('endpoint')
        .not('endpoint', 'is', null)
        .gte('created_at', new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString());

      const endpointCounts = (endpointErrors || []).reduce((acc: any, log: any) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {});

      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));

      // Get total error count
      const totalErrors = Object.values(countsByLevel).reduce((sum: any, count: any) => sum + count, 0);

      res.status(200).json({
        summary: {
          total: totalErrors,
          byLevel: {
            error: countsByLevel.error || 0,
            warn: countsByLevel.warn || 0,
            info: countsByLevel.info || 0,
          },
          days: daysNum,
        },
        hourlyRate: hourlyStats,
        topEndpoints,
      });
    } catch (error: any) {
      console.error('Get error stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/v1/admin/errors/:id - Get single error log
router.get('/errors/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const { data: errorLog, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !errorLog) {
        res.status(404).json({ error: 'Error log not found' });
        return;
      }

      res.status(200).json({ errorLog });
    } catch (error: any) {
      console.error('Get error log error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/v1/admin/errors - Clear old error logs
router.delete('/errors',
  authenticateToken,
  requireAdmin,
  [
    query('olderThan').optional().isInt({ min: 1 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { olderThan = '30' } = req.query; // Default: 30 days
      const days = parseInt(olderThan as string);

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoffDate)
        .select('id');

      if (error) {
        console.error('Failed to delete error logs:', error);
        res.status(500).json({ error: 'Failed to delete error logs' });
        return;
      }

      res.status(200).json({
        message: 'Old error logs deleted successfully',
        deleted: data?.length || 0,
        olderThan: `${days} days`,
      });
    } catch (error: any) {
      console.error('Delete error logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/v1/admin/errors/export - Export error logs
router.post('/errors/export',
  authenticateToken,
  requireAdmin,
  [
    body('format').optional().isIn(['json', 'csv']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('level').optional().isIn(['error', 'warn', 'info']),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { format = 'json', startDate, endDate, level } = req.body;

      // Build query
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000); // Max 10k records for export

      if (level) {
        query = query.eq('level', level);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: errorLogs, error } = await query;

      if (error) {
        console.error('Failed to fetch error logs for export:', error);
        res.status(500).json({ error: 'Failed to export error logs' });
        return;
      }

      if (format === 'csv') {
        // Convert to CSV
        const headers = ['id', 'level', 'message', 'endpoint', 'method', 'status_code', 'created_at'];
        const csvRows = [
          headers.join(','),
          ...(errorLogs || []).map((log: any) => 
            headers.map(h => {
              const value = log[h];
              // Escape commas and quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            }).join(',')
          ),
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="error-logs-${Date.now()}.csv"`);
        res.status(200).send(csvRows.join('\n'));
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="error-logs-${Date.now()}.json"`);
        res.status(200).json(errorLogs);
      }
    } catch (error: any) {
      console.error('Export error logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/v1/admin/anomaly-config - Get anomaly detection configuration
router.get('/anomaly-config',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await getAnomalyConfig();
      res.status(200).json({ config });
    } catch (error: any) {
      console.error('Get anomaly config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/v1/admin/anomaly-config - Update anomaly detection configuration
router.patch('/anomaly-config',
  authenticateToken,
  requireAdmin,
  [
    body('enabled').optional().isBoolean(),
    body('errorThreshold').optional().isInt({ min: 1 }),
    body('warnThreshold').optional().isInt({ min: 1 }),
    body('windowMinutes').optional().isInt({ min: 1, max: 60 }),
    body('cooldownMinutes').optional().isInt({ min: 1 }),
    body('alertEmail').optional().isEmail(),
    body('webhookUrl').optional().isURL(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: 'Validation failed', details: errors.array() });
        return;
      }

      await updateAnomalyConfig(req.body);
      const updatedConfig = await getAnomalyConfig();

      res.status(200).json({
        message: 'Anomaly detection config updated successfully',
        config: updatedConfig,
      });
    } catch (error: any) {
      console.error('Update anomaly config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/v1/admin/storage/stats - Get storage statistics
router.get('/storage/stats',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await getStorageStats();
      
      // Calculate usage percentage
      const quotaBytes = parseInt(process.env.STORAGE_QUOTA_BYTES || String(100 * 1024 * 1024 * 1024));
      const usagePercent = (stats.totalSize / quotaBytes) * 100;

      res.status(200).json({
        stats,
        quota: quotaBytes,
        usagePercent: parseFloat(usagePercent.toFixed(2)),
      });
    } catch (error: any) {
      console.error('Get storage stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/v1/admin/storage/check - Manually trigger storage check
router.post('/storage/check',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await checkStorageUsage();
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Storage check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


