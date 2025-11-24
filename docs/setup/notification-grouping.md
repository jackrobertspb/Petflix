# Notification Grouping Setup

## Overview
Notification grouping batches multiple notifications together to reduce notification spam. Instead of receiving 5 separate "like" notifications, users will receive a single grouped notification like "5 people liked your video".

## Database Setup

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- File: petflix/backend/src/db/add-notification-queue.sql
```

This creates:
- `notification_queue` table to store pending notifications
- Indexes for efficient querying
- Cleanup function for old notifications

## How It Works

1. **Queueing**: When a notification is triggered (like, comment, follow, new video), it's queued in the `notification_queue` table instead of being sent immediately.

2. **Grouping Window**: Notifications are grouped within a 5-minute window.

3. **Processing**: Every minute, the system processes queued notifications that are older than 5 minutes.

4. **Grouping Logic**:
   - **Likes**: "5 people liked your video" or "5 likes on 3 videos"
   - **Comments**: "3 new comments on your video" or "5 new comments on 2 videos"
   - **Follows**: "3 new followers"
   - **Videos**: "2 new videos from username" or "5 new videos from 3 users"

5. **Sending**: Grouped notifications are sent as a single push notification with a summary message.

## Testing

### Using the Test Button
1. Log in to the application
2. Click the "🔔 Test Notifications" button in the navbar
3. This will queue:
   - 5 likes
   - 2 comments
   - 3 follows
4. Wait up to 5 minutes for the grouped notifications to be sent

### Manual Testing
You can also test by:
- Having multiple users like your video
- Having multiple users comment on your video
- Having multiple users follow you

All notifications will be grouped and sent within 5 minutes.

## Configuration

The grouping window and processing interval can be adjusted in:
`petflix/backend/src/services/notificationGrouping.ts`

- `GROUPING_WINDOW_MS`: Time window for grouping (default: 5 minutes)
- `PROCESSING_INTERVAL_MS`: How often to process the queue (default: 1 minute)

## Notes

- Notifications are only grouped if they occur within the same 5-minute window
- Each notification type is grouped separately (likes, comments, follows, videos)
- If only one notification of a type occurs, it's sent individually (not grouped)
- The notification bell badge will still update in real-time, even when notifications are grouped


