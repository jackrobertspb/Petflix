-- Add view_count column to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for view_count (used in sorting/trending)
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);

-- Create video_views table to track individual views (for analytics)
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET, -- Optional: for analytics
  user_agent TEXT -- Optional: for analytics
);

-- Indexes for video_views
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id) WHERE user_id IS NOT NULL;

-- Composite index for recent view checks (cooldown queries)
CREATE INDEX IF NOT EXISTS idx_video_views_cooldown_user ON video_views(video_id, user_id, viewed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_views_cooldown_ip ON video_views(video_id, ip_address, viewed_at DESC) WHERE ip_address IS NOT NULL;

