# Run Notification Queue Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Petflix project

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button (top right)

3. **Copy and Paste This SQL**
   - Open the file: `petflix/backend/src/db/add-notification-queue.sql`
   - Copy **ALL** the contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click the **"Run"** button (or press Ctrl+Enter)
   - Wait for success message: ✅ "Success. No rows returned"

5. **Verify It Worked**
   - Go to **"Table Editor"** in the left sidebar
   - You should see `notification_queue` table ✅

## The SQL to Run

```sql
-- Create notification_queue table for grouping notifications
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  notification_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent_at ON notification_queue(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_unsent ON notification_queue(user_id, sent_at) WHERE sent_at IS NULL;

-- Clean up old sent notifications (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_queue
  WHERE sent_at IS NOT NULL
    AND sent_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

## After Running

1. ✅ The backend errors should stop
2. ✅ You can now test notification grouping
3. ✅ Click the "🔔 Test Notifications" button in the navbar


