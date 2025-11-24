-- Create function to increment video view count
CREATE OR REPLACE FUNCTION increment_video_view(video_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = video_id_param;
END;
$$ LANGUAGE plpgsql;

