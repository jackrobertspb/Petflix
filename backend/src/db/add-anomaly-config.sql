-- Create anomaly_config table for configurable anomaly detection thresholds

CREATE TABLE IF NOT EXISTS anomaly_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  error_threshold INTEGER NOT NULL DEFAULT 10, -- Errors per minute
  warn_threshold INTEGER NOT NULL DEFAULT 20, -- Warnings per minute
  window_minutes INTEGER NOT NULL DEFAULT 5, -- Time window to check
  cooldown_minutes INTEGER NOT NULL DEFAULT 30, -- Minimum time between alerts
  alert_email VARCHAR(255), -- Admin email for alerts
  webhook_url VARCHAR(500), -- Webhook URL for external alerting
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO anomaly_config (enabled, error_threshold, warn_threshold, window_minutes, cooldown_minutes)
VALUES (true, 10, 20, 5, 30)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT ON anomaly_config TO authenticated;

COMMENT ON TABLE anomaly_config IS 'Configuration for error rate anomaly detection and alerting';
COMMENT ON COLUMN anomaly_config.error_threshold IS 'Max errors per minute before alerting';
COMMENT ON COLUMN anomaly_config.warn_threshold IS 'Max warnings per minute before alerting';
COMMENT ON COLUMN anomaly_config.window_minutes IS 'Time window to calculate error rate';
COMMENT ON COLUMN anomaly_config.cooldown_minutes IS 'Minimum minutes between alerts to prevent spam';

