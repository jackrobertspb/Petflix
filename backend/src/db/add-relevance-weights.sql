-- Create relevance_weights table for configurable search algorithm
CREATE TABLE IF NOT EXISTS relevance_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_match DECIMAL(3,2) NOT NULL DEFAULT 0.40,
  view_count DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  like_ratio DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  recency DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  engagement DECIMAL(3,2) NOT NULL DEFAULT 0.15,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT weights_sum_to_one CHECK (
    keyword_match + view_count + like_ratio + recency + engagement = 1.00
  )
);

-- Insert default weights
INSERT INTO relevance_weights (keyword_match, view_count, like_ratio, recency, engagement)
VALUES (0.40, 0.15, 0.15, 0.15, 0.15)
ON CONFLICT DO NOTHING;


