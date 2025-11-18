import webpush from 'web-push';
import { supabase } from '../config/supabase.js';

// Configure web-push with VAPID details (only if keys are provided)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@petflix.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ Push notifications configured with VAPID keys');
} else {
  console.warn('⚠️  VAPID keys not configured. Push notifications will be disabled.');
  console.warn('   Run: node src/scripts/generate-vapid-keys.js to generate keys');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Send push notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  // Skip if VAPID keys not configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log(`🔔 [PUSH] ⚠️  Push notifications disabled - VAPID keys not configured`);
    return;
  }

  try {
    console.log(`🔔 [PUSH] Attempting to send notification to user: ${userId}`);
    console.log(`🔔 [PUSH] Notification title: ${payload.title}`);
    
    // Get all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('🔔 [PUSH] ❌ Error fetching subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`🔔 [PUSH] ⚠️ No push subscriptions found for user ${userId}`);
      console.log(`🔔 [PUSH] 💡 User needs to enable notifications in Settings`);
      return;
    }
    
    console.log(`🔔 [PUSH] ✅ Found ${subscriptions.length} subscription(s) for user ${userId}`);

    // Send notification to each subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/pwa-icon-192.png',
          badge: payload.badge || '/pwa-icon-192.png',
          tag: payload.tag || 'petflix-notification',
          data: {
            url: payload.url || '/',
          },
        });

        await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log(`✅ Notification sent to user ${userId}`);
      } catch (error: any) {
        console.error(`Failed to send notification to subscription ${sub.id}:`, error);

        // If subscription is no longer valid (410 Gone), remove it
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log(`Removed invalid subscription ${sub.id}`);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error in sendNotificationToUser:', error);
  }
}

/**
 * Send notification when user gets a new follower
 */
export async function notifyNewFollower(
  userId: string,
  followerUsername: string,
  followerUserId: string
): Promise<void> {
  await sendNotificationToUser(userId, {
    title: 'New Follower! 🎉',
    body: `${followerUsername} started following you`,
    tag: `new-follower-${followerUserId}`,
    url: `/profile/${followerUserId}`,
  });
}

/**
 * Send notification when followed user shares a new video
 */
export async function notifyNewVideoFromFollowedUser(
  userId: string,
  uploaderUsername: string,
  videoTitle: string,
  videoId: string
): Promise<void> {
  await sendNotificationToUser(userId, {
    title: `New video from ${uploaderUsername} 🎬`,
    body: videoTitle,
    tag: `new-video-${videoId}`,
    url: `/video/${videoId}`,
  });
}

/**
 * Send notification when someone comments on user's video
 */
export async function notifyNewComment(
  userId: string,
  commenterUsername: string,
  commentText: string,
  videoId: string
): Promise<void> {
  // Truncate comment if too long
  const truncatedComment = commentText.length > 100
    ? commentText.substring(0, 100) + '...'
    : commentText;

  await sendNotificationToUser(userId, {
    title: `New comment from ${commenterUsername} 💬`,
    body: truncatedComment,
    tag: `new-comment-${videoId}`,
    url: `/video/${videoId}`,
  });
}

/**
 * Send notification when someone likes user's video
 */
export async function notifyVideoLike(
  userId: string,
  likerUsername: string,
  videoTitle: string,
  videoId: string
): Promise<void> {
  await sendNotificationToUser(userId, {
    title: `${likerUsername} liked your video! ❤️`,
    body: videoTitle,
    tag: `video-like-${videoId}`,
    url: `/video/${videoId}`,
  });
}

export default {
  sendNotificationToUser,
  notifyNewFollower,
  notifyNewVideoFromFollowedUser,
  notifyNewComment,
  notifyVideoLike,
};

