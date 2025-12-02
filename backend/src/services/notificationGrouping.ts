// Notification Grouping Service
// Groups multiple notifications together to reduce spam

import { supabase } from '../config/supabase.js';
import { sendNotificationToUser } from './push.js';

interface QueuedNotification {
  id: string;
  user_id: string;
  notification_type: 'follow' | 'comment' | 'video_like' | 'video';
  notification_data: any;
  created_at: string;
  sent_at: string | null;
}

// Grouping window: How long to wait before sending grouped notifications
// Set to 30 seconds for testing, 5 minutes for production
const GROUPING_WINDOW_MS = process.env.NODE_ENV === 'production' 
  ? 5 * 60 * 1000  // 5 minutes in production
  : 30 * 1000;     // 30 seconds in development (for easier testing)

const PROCESSING_INTERVAL_MS = 10 * 1000; // Process every 10 seconds (faster for testing)

/**
 * Queue a notification for grouping
 */
export async function queueNotification(
  userId: string,
  type: 'follow' | 'comment' | 'video_like' | 'video',
  data: any
): Promise<void> {
  try {
    // Check for duplicate unsent notifications before inserting
    // For video_like: prevent duplicate notifications if user likes, unlikes, then relikes
    if (type === 'video_like' && data.videoId) {
      // Check for unsent notification in queue
      const { data: existingQueuedNotification } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'video_like')
        .eq('notification_data->>videoId', data.videoId)
        .is('sent_at', null)
        .maybeSingle();

      if (existingQueuedNotification) {
        console.log(`🔔 [QUEUE] Skipping duplicate video_like notification for video ${data.videoId} (user ${userId}) - already in queue`);
        return; // Don't create duplicate notification
      }

      // Also check for recent notification in notifications table (within last 5 minutes)
      // This prevents duplicates even if the first notification was already sent
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'video_like')
        .like('link', `%/video/${data.videoId}%`)
        .gte('created_at', fiveMinutesAgo)
        .maybeSingle();

      if (recentNotification) {
        console.log(`🔔 [QUEUE] Skipping duplicate video_like notification for video ${data.videoId} (user ${userId}) - recent notification exists`);
        return; // Don't create duplicate notification
      }
    }

    // For comments: prevent duplicate notifications for same comment
    if (type === 'comment' && data.commentId) {
      const { data: existingNotification } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'comment')
        .eq('notification_data->>commentId', data.commentId)
        .is('sent_at', null)
        .maybeSingle();

      if (existingNotification) {
        console.log(`🔔 [QUEUE] Skipping duplicate comment notification for comment ${data.commentId} (user ${userId})`);
        return; // Don't create duplicate notification
      }
    }

    const { error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        notification_type: type,
        notification_data: data,
        sent_at: null,
      });

    if (error) {
      // Check if table doesn't exist (schema cache issue)
      if (error.code === 'PGRST205') {
        console.warn('⚠️  notification_queue table not found. Please run the migration: petflix/backend/src/db/add-notification-queue.sql');
        console.warn('   Falling back to immediate notification send.');
        // Fallback: send immediately if queue fails
        await sendNotificationImmediately(userId, type, data);
        return;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Failed to queue notification:', error);
    // Fallback: send immediately if queue fails
    await sendNotificationImmediately(userId, type, data);
  }
}

/**
 * Send notification immediately (fallback or urgent notifications)
 */
async function sendNotificationImmediately(
  userId: string,
  type: 'follow' | 'comment' | 'video_like' | 'video',
  data: any
): Promise<void> {
  const { notifyNewFollower, notifyNewComment, notifyVideoLike, notifyNewVideoFromFollowedUser } = await import('./push.js');
  
  switch (type) {
    case 'follow':
      await notifyNewFollower(userId, data.username, data.followerId);
      break;
    case 'comment':
      await notifyNewComment(userId, data.username, data.commentText, data.videoId);
      break;
    case 'video_like':
      await notifyVideoLike(userId, data.username, data.videoTitle, data.videoId);
      break;
    case 'video':
      await notifyNewVideoFromFollowedUser(userId, data.username, data.videoTitle, data.videoId);
      break;
  }
}

/**
 * Group notifications by type and create summaries
 */
function groupNotifications(notifications: QueuedNotification[]): Array<{
  type: string;
  items: QueuedNotification[];
  summary: string;
  url: string;
}> {
  const grouped: Record<string, QueuedNotification[]> = {};
  
  // Group by type
  notifications.forEach(notif => {
    if (!grouped[notif.notification_type]) {
      grouped[notif.notification_type] = [];
    }
    grouped[notif.notification_type].push(notif);
  });

  const groups: Array<{
    type: string;
    items: QueuedNotification[];
    summary: string;
    url: string;
  }> = [];

  // Create summaries for each group
  Object.entries(grouped).forEach(([type, items]) => {
    const count = items.length;
    
    let summary = '';
    let url = '/';

    switch (type) {
      case 'follow':
        if (count === 1) {
          summary = `${items[0].notification_data.username} started following you`;
          url = `/profile/${items[0].notification_data.followerId}`;
        } else {
          summary = `${count} new followers`;
          url = '/feed';
        }
        break;
      
      case 'comment':
        if (count === 1) {
          summary = `New comment from ${items[0].notification_data.username}`;
          url = `/video/${items[0].notification_data.videoId}`;
        } else {
          const uniqueVideos = new Set(items.map(i => i.notification_data.videoId));
          if (uniqueVideos.size === 1) {
            summary = `${count} new comments on your video`;
            url = `/video/${items[0].notification_data.videoId}`;
          } else {
            summary = `${count} new comments on ${uniqueVideos.size} videos`;
            url = '/feed';
          }
        }
        break;
      
      case 'video_like':
        if (count === 1) {
          summary = `${items[0].notification_data.username} liked your video`;
          url = `/video/${items[0].notification_data.videoId}`;
        } else {
          const uniqueVideos = new Set(items.map(i => i.notification_data.videoId));
          if (uniqueVideos.size === 1) {
            summary = `${count} people liked your video`;
            url = `/video/${items[0].notification_data.videoId}`;
          } else {
            summary = `${count} likes on ${uniqueVideos.size} videos`;
            url = '/feed';
          }
        }
        break;
      
      case 'video':
        if (count === 1) {
          summary = `New video from ${items[0].notification_data.username}`;
          url = `/video/${items[0].notification_data.videoId}`;
        } else {
          const uniqueUsers = new Set(items.map(i => i.notification_data.username));
          if (uniqueUsers.size === 1) {
            summary = `${count} new videos from ${items[0].notification_data.username}`;
            url = `/profile/${items[0].notification_data.userId}`;
          } else {
            summary = `${count} new videos from ${uniqueUsers.size} users`;
            url = '/feed';
          }
        }
        break;
    }

    groups.push({ type, items, summary, url });
  });

  return groups;
}

/**
 * Process notification queue and send grouped notifications
 */
export async function processNotificationQueue(): Promise<void> {
  try {
    // const _cutoffTime = new Date(Date.now() - GROUPING_WINDOW_MS).toISOString();
    // const now = Date.now();
    // console.log(`🔔 [GROUPING] Processing queue (cutoff: ${_cutoffTime}, window: ${GROUPING_WINDOW_MS}ms, now: ${new Date(now).toISOString()})`);
    
    // First, check ALL unsent notifications (for debugging)
    const { data: allUnsent, error: _allError } = await supabase
      .from('notification_queue')
      .select('*')
      .is('sent_at', null);
    
    if (allUnsent && allUnsent.length > 0) {
      // const oldest = allUnsent.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      // const _oldestAge = now - new Date(oldest.created_at).getTime();
      // console.log(`🔔 [GROUPING] DEBUG: Found ${allUnsent.length} total unsent notifications. Oldest is ${Math.floor(_oldestAge / 1000)}s old`);
    }
    
    // Get all unsent notifications (don't use cutoff - we want to process all unsent, even if older)
    // The cutoff is only used to determine which ones are "ready" to send
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .is('sent_at', null)
      .order('created_at', { ascending: true });
    
    // console.log(`🔔 [GROUPING] Found ${notifications?.length || 0} total unsent notifications`);

    if (error) {
      // Check if table doesn't exist (schema cache issue)
      if (error.code === 'PGRST205') {
        console.warn('⚠️  notification_queue table not found. Please run the migration: petflix/backend/src/db/add-notification-queue.sql');
        console.warn('   After running, Supabase may need a moment to refresh the schema cache.');
        return;
      }
      console.error('Error fetching notification queue:', error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      return; // No notifications to process
    }

    // Group by user
    const byUser: Record<string, QueuedNotification[]> = {};
    notifications.forEach(notif => {
      if (!byUser[notif.user_id]) {
        byUser[notif.user_id] = [];
      }
      byUser[notif.user_id].push(notif);
    });

    // Process each user's notifications
    for (const [userId, userNotifications] of Object.entries(byUser)) {
      // console.log(`🔔 [GROUPING] Processing ${userNotifications.length} notifications for user ${userId}`);
      
      // Check if any notifications are older than grouping window (ready to send)
      const readyToSend = userNotifications.filter(notif => {
        const notifTime = new Date(notif.created_at).getTime();
        const age = Date.now() - notifTime;
        const isReady = age >= GROUPING_WINDOW_MS;
        if (isReady) {
          // console.log(`🔔 [GROUPING] ✅ Notification ${notif.id} is ready (age: ${Math.floor(age / 1000)}s, required: ${GROUPING_WINDOW_MS / 1000}s)`);
        }
        return isReady;
      });

      // console.log(`🔔 [GROUPING] Found ${readyToSend.length} ready to send out of ${userNotifications.length} total`);

      if (readyToSend.length === 0) {
        const oldest = userNotifications[0];
        if (oldest) {
          // const _age = Date.now() - new Date(oldest.created_at).getTime();
          // console.log(`🔔 [GROUPING] ⏳ Waiting for notifications to age (oldest: ${Math.floor(_age / 1000)}s / ${GROUPING_WINDOW_MS / 1000}s)`);
        }
        continue; // Wait for grouping window
      }

      // Group the ready notifications
      // console.log(`🔔 [GROUPING] Grouping ${readyToSend.length} notifications...`);
      const groups = groupNotifications(readyToSend);
      // console.log(`🔔 [GROUPING] Created ${groups.length} notification group(s)`);

      // Send grouped notifications
      for (const group of groups) {
        console.log(`🔔 [GROUPING] Processing group:`, {
          type: group.type,
          itemCount: group.items.length,
          summary: group.summary,
        });
        const title = getNotificationTitle(group.type, group.items.length);
        
        console.log(`🔔 [GROUPING] Sending grouped notification to user ${userId}:`, {
          type: group.type,
          count: group.items.length,
          title,
          summary: group.summary,
        });
        
        await sendNotificationToUser(userId, {
          title,
          body: group.summary,
          tag: `grouped-${group.type}-${Date.now()}`,
          url: group.url,
        });

        // Mark notifications as sent (ONLY after successfully sending)
        const ids = group.items.map(i => i.id);
        console.log(`🔔 [GROUPING] Marking ${ids.length} notifications as sent in queue...`);
        const { data: updated, error: updateError } = await supabase
          .from('notification_queue')
          .update({ sent_at: new Date().toISOString() })
          .in('id', ids)
          .select();
        
        if (updateError) {
          console.error(`🔔 [GROUPING] ❌ Failed to mark notifications as sent:`, updateError);
        } else {
          console.log(`🔔 [GROUPING] ✅ Marked ${updated?.length || 0} notifications as sent in queue (IDs: ${ids.slice(0, 3).join(', ')}...)`);
        }
      }
      
      console.log(`🔔 [GROUPING] ✅ Finished processing all groups for user ${userId}`);
    }
  } catch (error) {
    console.error('🔔 [GROUPING] ❌ Error processing notification queue:', error);
    console.error('🔔 [GROUPING] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

/**
 * Get notification title based on type and count
 */
function getNotificationTitle(type: string, count: number): string {
  switch (type) {
    case 'follow':
      return count === 1 ? 'New Follower! 🎉' : `${count} New Followers! 🎉`;
    case 'comment':
      return count === 1 ? 'New Comment 💬' : `${count} New Comments 💬`;
    case 'video_like':
      return count === 1 ? 'Video Liked! ❤️' : `${count} Video Likes! ❤️`;
    case 'video':
      return count === 1 ? 'New Video 🎬' : `${count} New Videos 🎬`;
    default:
      return 'Petflix Updates';
  }
}

/**
 * Start the notification queue processor
 */
export function startNotificationProcessor(): void {
  // Process immediately on start
  processNotificationQueue().catch(err => {
    console.error('Initial notification queue processing error:', err);
  });

  // Then process every minute
  setInterval(() => {
    processNotificationQueue().catch(err => {
      console.error('Notification queue processing error:', err);
    });
  }, PROCESSING_INTERVAL_MS);

  console.log('✅ Notification grouping processor started');
}

