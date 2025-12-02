-- Create error_logs table for centralized error tracking
-- This enables the admin error dashboard

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON error_logs(endpoint) WHERE endpoint IS NOT NULL;

-- Create view for error statistics
CREATE OR REPLACE VIEW error_log_stats AS
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  level,
  COUNT(*) AS error_count,
  COUNT(DISTINCT user_id) AS affected_users,
  COUNT(DISTINCT endpoint) AS affected_endpoints
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), level
ORDER BY hour DESC;

-- Grant permissions
GRANT SELECT ON error_logs TO authenticated;
GRANT INSERT ON error_logs TO authenticated;
GRANT SELECT ON error_log_stats TO authenticated;

COMMENT ON TABLE error_logs IS 'Centralized error logging for admin dashboard';
COMMENT ON COLUMN error_logs.level IS 'Error severity: error, warn, or info';
COMMENT ON COLUMN error_logs.context IS 'Additional context data (URL, IP, user agent, etc.)';
COMMENT ON COLUMN error_logs.stack IS 'Stack trace for errors';

