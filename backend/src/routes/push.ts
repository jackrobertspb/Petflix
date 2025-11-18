import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

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

export default router;

