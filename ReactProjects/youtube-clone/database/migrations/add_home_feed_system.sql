-- Migration: Add home feed and recommendation system
-- Date: 2025-12-13

-- Create user_preferences table for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories JSONB DEFAULT '[]'::jsonb,
  preferred_languages JSONB DEFAULT '[]'::jsonb,
  blocked_channels JSONB DEFAULT '[]'::jsonb,
  autoplay_enabled BOOLEAN DEFAULT true,
  mature_content_filter BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create video_categories table
CREATE TABLE IF NOT EXISTS video_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.00-1.00
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, category)
);

-- Create video_tags table for better search and recommendations
CREATE TABLE IF NOT EXISTS video_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, tag)
);

-- Create video_interactions table for tracking engagement
CREATE TABLE IF NOT EXISTS video_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  interaction_type VARCHAR(30) NOT NULL, -- view, like, dislike, share, save
  interaction_value INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trending_videos materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_videos AS
SELECT 
  v.id,
  v.title,
  v.thumbnail_url,
  v.views,
  v.likes,
  v.dislikes,
  v.channel_name,
  v.duration,
  v.created_at,
  v.quality,
  -- Calculate trending score
  (
    (v.views * 1.0) + 
    (v.likes * 5.0) - 
    (v.dislikes * 2.0) +
    (EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 3600 * -0.1) -- Decay over time
  ) AS trending_score
FROM videos v
WHERE v.is_public = true
  AND v.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC
LIMIT 100;

-- Create index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_videos_id ON trending_videos(id);

-- Create function to refresh trending videos
CREATE OR REPLACE FUNCTION refresh_trending_videos()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_videos;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX IF NOT EXISTS idx_video_categories_category ON video_categories(category);
CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_tag ON video_tags(tag);
CREATE INDEX IF NOT EXISTS idx_video_interactions_user_id ON video_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_video_id ON video_interactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_type ON video_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_video_interactions_created_at ON video_interactions(created_at);

-- Add RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_interactions ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Video categories policies (public read, owner write)
CREATE POLICY "Anyone can view video categories"
ON video_categories FOR SELECT
USING (true);

CREATE POLICY "Video owners can manage categories"
ON video_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = video_categories.video_id 
    AND videos.user_id = auth.uid()
  )
);

-- Video tags policies (public read, owner write)
CREATE POLICY "Anyone can view video tags"
ON video_tags FOR SELECT
USING (true);

CREATE POLICY "Video owners can manage tags"
ON video_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = video_tags.video_id 
    AND videos.user_id = auth.uid()
  )
);

-- Video interactions policies
CREATE POLICY "Users can view their own interactions"
ON video_interactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interactions"
ON video_interactions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Video owners can view interactions on their videos"
ON video_interactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = video_interactions.video_id 
    AND videos.user_id = auth.uid()
  )
);

-- Add comments
COMMENT ON TABLE user_preferences IS 'User preferences for personalized recommendations';
COMMENT ON TABLE video_categories IS 'Video categories for classification and recommendations';
COMMENT ON TABLE video_tags IS 'Video tags for search and discovery';
COMMENT ON TABLE video_interactions IS 'User interactions with videos for recommendation engine';
COMMENT ON MATERIALIZED VIEW trending_videos IS 'Cached trending videos updated periodically';
COMMENT ON COLUMN video_categories.confidence IS 'Confidence score for category classification (0-1)';
COMMENT ON COLUMN video_interactions.interaction_value IS 'Weighted value of interaction';

-- Common categories
INSERT INTO video_categories (video_id, category) VALUES
  ((SELECT id FROM videos LIMIT 1), 'Entertainment'),
  ((SELECT id FROM videos LIMIT 1), 'Education')
ON CONFLICT DO NOTHING;
