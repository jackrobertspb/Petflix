import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
// import { queueNotification } from '../services/notificationGrouping.js';

const router = Router();

// Validation rules
const validateSubscription = [
  body('endpoint').isURL().withMessage('Valid endpoint URL is required'),
  body('keys.p256dh').notEmpty().withMessage('p256dh key is required'),
  body('keys.auth').notEmpty().withMessage('auth key is required'),
];

// POST /api/v1/push/subscribe - Subscribe to push notifications
router.post('/subscribe', authenticateToken, validateSubscription, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const userId = req.userId!;
    const { endpoint, keys } = req.body;

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      res.status(200).json({
        message: 'Subscription already exists',
        subscription: { id: existing.id }
      });
      return;
    }

    // Create new subscription
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .select()
      .single();

    if (error || !subscription) {
      console.error('Push subscription error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
      return;
    }

    res.status(201).json({
      message: 'Successfully subscribed to push notifications',
      subscription: {
        id: subscription.id,
        created_at: subscription.created_at
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/push/unsubscribe - Unsubscribe from push notifications
router.delete('/unsubscribe', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint is required' });
      return;
    }

    // Delete subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
      return;
    }

    res.status(200).json({ message: 'Successfully unsubscribed from push notifications' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/push/public-key - Get VAPID public key
router.get('/public-key', (_req: Request, res: Response): void => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    res.status(500).json({ error: 'VAPID public key not configured' });
    return;
  }

  res.status(200).json({ publicKey });
});

// DELETE /api/v1/push/unsubscribe-all - Unsubscribe from all devices
router.delete('/unsubscribe-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Delete all subscriptions for this user
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Unsubscribe all error:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
      return;
    }

    res.status(200).json({ message: 'Successfully unsubscribed from all devices' });
  } catch (error) {
    console.error('Unsubscribe all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/push/debug - Comprehensive debug endpoint (development only)
router.get('/debug', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Debug endpoint not available in production' });
      return;
    }

    const userId = req.userId!;
    const debugInfo: any = {
      userId,
      timestamp: new Date().toISOString(),
    };

    // Check VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    debugInfo.vapidKeys = {
      publicKey: vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : 'NOT SET',
      privateKey: vapidPrivateKey ? 'SET' : 'NOT SET',
      configured: !!(vapidPublicKey && vapidPrivateKey),
    };

    // Check push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    debugInfo.pushSubscriptions = {
      count: subscriptions?.length || 0,
      subscriptions: subscriptions || [],
      error: subError?.message,
    };

    // Check notification queue
    const { data: queueData, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    debugInfo.notificationQueue = {
      total: queueData?.length || 0,
      unsent: queueData?.filter(n => !n.sent_at).length || 0,
      sent: queueData?.filter(n => n.sent_at).length || 0,
      recent: queueData?.slice(0, 5) || [],
      error: queueError?.message,
    };

    // Check if table exists
    if (queueError && queueError.code === 'PGRST205') {
      debugInfo.tableExists = false;
      debugInfo.error = 'notification_queue table does not exist';
    } else {
      debugInfo.tableExists = true;
    }

    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/v1/push/queue-status - Check notification queue status (development only)
router.get('/queue-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Debug endpoint not available in production' });
      return;
    }

    const userId = req.userId!;

    // Check if table exists
    const { data: _tableCheck, error: tableError } = await supabase
      .from('notification_queue')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === 'PGRST205') {
      res.status(400).json({
        error: 'Table does not exist',
        message: 'notification_queue table not found. Please run the migration first.',
        migrationFile: 'petflix/backend/src/db/add-notification-queue.sql',
      });
      return;
    }

    // Get all notifications for this user
    const { data: allNotifications, error: allError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allError) {
      res.status(500).json({ error: 'Failed to fetch notifications', details: allError });
      return;
    }

    // Get unsent notifications
    const { data: unsentNotifications, error: unsentError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('user_id', userId)
      .is('sent_at', null)
      .order('created_at', { ascending: true });

    if (unsentError) {
      res.status(500).json({ error: 'Failed to fetch unsent notifications', details: unsentError });
      return;
    }

    // Group by type
    const grouped = {
      video_like: unsentNotifications?.filter(n => n.notification_type === 'video_like') || [],
      comment: unsentNotifications?.filter(n => n.notification_type === 'comment') || [],
      follow: unsentNotifications?.filter(n => n.notification_type === 'follow') || [],
      video: unsentNotifications?.filter(n => n.notification_type === 'video') || [],
    };

    // Calculate oldest notification age
    const oldestNotification = unsentNotifications && unsentNotifications.length > 0
      ? unsentNotifications[0]
      : null;
    
    const oldestAge = oldestNotification
      ? Date.now() - new Date(oldestNotification.created_at).getTime()
      : null;

    res.status(200).json({
      tableExists: true,
      totalNotifications: allNotifications?.length || 0,
      unsentCount: unsentNotifications?.length || 0,
      sentCount: (allNotifications?.length || 0) - (unsentNotifications?.length || 0),
      grouped: {
        likes: grouped.video_like.length,
        comments: grouped.comment.length,
        follows: grouped.follow.length,
        videos: grouped.video.length,
      },
      oldestNotification: oldestNotification ? {
        id: oldestNotification.id,
        type: oldestNotification.notification_type,
        created_at: oldestNotification.created_at,
        age_seconds: oldestAge ? Math.floor(oldestAge / 1000) : null,
        ready_to_send: oldestAge ? oldestAge >= (process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 30 * 1000) : false,
      } : null,
      groupingWindow: process.env.NODE_ENV === 'production' ? '5 minutes' : '30 seconds',
      processingInterval: '10 seconds',
      notifications: unsentNotifications?.slice(0, 10) || [], // Show first 10
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

// POST /api/v1/push/process-queue - Manually trigger queue processing (development only)
router.post('/process-queue', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Debug endpoint not available in production' });
      return;
    }

    const { processNotificationQueue } = await import('../services/notificationGrouping.js');
    
    console.log('🧪 [TEST] Manually triggering queue processing...');
    await processNotificationQueue();
    console.log('🧪 [TEST] Queue processing complete');

    res.status(200).json({ message: 'Queue processed successfully' });
  } catch (error) {
    console.error('Process queue error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/v1/push/notifications - Get user's notifications for in-app bell
router.get('/notifications', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;

    // console.log(`🔔 [API] Fetching notifications for user: ${userId}`);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist, return empty array (graceful degradation)
      if (error.code === 'PGRST205') {
        console.warn('🔔 [API] ⚠️ notifications table does not exist');
        res.status(200).json({ notifications: [], unreadCount: 0, error: 'Table does not exist. Run migration: petflix/backend/src/db/add-notifications-table.sql' });
        return;
      }
      console.error('🔔 [API] ❌ Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
      return;
    }

    const unreadCount = notifications?.filter(n => !n.read).length || 0;
    // console.log(`🔔 [API] ✅ Found ${notifications?.length || 0} notifications, ${unreadCount} unread`);

    res.status(200).json({
      notifications: notifications || [],
      unreadCount,
    });
  } catch (error) {
    console.error('🔔 [API] ❌ Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

// PATCH /api/v1/push/notifications/:notificationId/read - Mark notification as read
router.patch('/notifications/:notificationId/read', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user can only mark their own notifications as read

    if (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
      return;
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/push/notifications/read-all - Mark all notifications as read
router.patch('/notifications/read-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
      return;
    }

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/push/notifications/:notificationId - Delete a notification
router.delete('/notifications/:notificationId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { notificationId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user can only delete their own notifications

    if (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
      return;
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

