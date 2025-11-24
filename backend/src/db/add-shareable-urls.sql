-- Add shareable URL tracking table
CREATE TABLE IF NOT EXISTS shareable_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  share_code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  click_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shareable_urls_share_code ON shareable_urls(share_code);
CREATE INDEX IF NOT EXISTS idx_shareable_urls_video_id ON shareable_urls(video_id);

