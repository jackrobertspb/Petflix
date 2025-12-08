-- Add video availability tracking
-- This allows us to hide videos that are no longer available on YouTube

ALTER TABLE videos
ADD COLUMN is_available BOOLEAN DEFAULT true,
ADD COLUMN last_availability_check TIMESTAMP DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_videos_is_available ON videos(is_available);

-- Add comment to document the columns
COMMENT ON COLUMN videos.is_available IS 'Whether the video is still available on YouTube';
COMMENT ON COLUMN videos.last_availability_check IS 'When we last checked if this video is available';

