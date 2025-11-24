-- Allow multiple users to share the same YouTube video
-- But prevent the same user from sharing the same video twice
-- This matches the PRD requirement: "prevent duplicate video links from being shared by the same user"

-- Remove the unique constraint on youtube_video_id
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_youtube_video_id_key;

-- Add composite unique constraint on (youtube_video_id, user_id)
-- This allows different users to share the same video, but prevents the same user from sharing it twice
ALTER TABLE videos
ADD CONSTRAINT videos_youtube_video_id_user_id_unique UNIQUE (youtube_video_id, user_id);

-- Update the index to support the new constraint
DROP INDEX IF EXISTS idx_videos_youtube_id;
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_video_id);



