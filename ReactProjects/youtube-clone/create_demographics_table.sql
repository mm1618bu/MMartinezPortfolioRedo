-- SQL Schema for Audience Demographics Tracking
-- Create video_views table for storing demographic data

CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Device Information
  device VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  resolution VARCHAR(20),
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  
  -- Geographic/Time Information
  timezone VARCHAR(100),
  locale VARCHAR(20),
  region VARCHAR(50),
  time_of_day VARCHAR(20),
  day_of_week VARCHAR(20),
  
  -- Timestamps
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewed_at ON video_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_views_device ON video_views(device);
CREATE INDEX IF NOT EXISTS idx_video_views_region ON video_views(region);
CREATE INDEX IF NOT EXISTS idx_video_views_time_of_day ON video_views(time_of_day);

-- Row Level Security (RLS)
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views (for tracking)
CREATE POLICY "Anyone can insert video views"
  ON video_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Video owners can read their video analytics
CREATE POLICY "Video owners can read their analytics"
  ON video_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_views.video_id
      AND videos.user_id = auth.uid()
    )
  );

-- Policy: Public can read aggregate data (for public analytics)
CREATE POLICY "Public can read video views"
  ON video_views
  FOR SELECT
  TO public
  USING (true);
