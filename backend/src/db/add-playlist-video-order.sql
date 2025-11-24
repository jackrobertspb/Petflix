-- Add position/order column to playlist_videos junction table
ALTER TABLE playlist_videos
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing records to have sequential positions based on created_at
-- This ensures existing playlists have proper ordering
UPDATE playlist_videos pv
SET position = sub.row_num - 1
FROM (
  SELECT 
    playlist_id,
    video_id,
    ROW_NUMBER() OVER (PARTITION BY playlist_id ORDER BY created_at ASC) as row_num
  FROM playlist_videos
) sub
WHERE pv.playlist_id = sub.playlist_id AND pv.video_id = sub.video_id;

-- Create index for position (used in ordering)
CREATE INDEX IF NOT EXISTS idx_playlist_videos_position ON playlist_videos(playlist_id, position);

