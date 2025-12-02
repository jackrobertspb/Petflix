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


