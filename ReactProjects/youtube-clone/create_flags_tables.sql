-- Create flagged_comments table
CREATE TABLE IF NOT EXISTS flagged_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  flagged_by_user_id TEXT NOT NULL,
  flagged_by_username TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- Create flagged_videos table
CREATE TABLE IF NOT EXISTS flagged_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  flagged_by_user_id TEXT NOT NULL,
  flagged_by_username TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- Create indexes
CREATE INDEX idx_flagged_comments_video_id ON flagged_comments(video_id);
CREATE INDEX idx_flagged_comments_status ON flagged_comments(status);
CREATE INDEX idx_flagged_comments_created_at ON flagged_comments(created_at DESC);

CREATE INDEX idx_flagged_videos_channel_id ON flagged_videos(channel_id);
CREATE INDEX idx_flagged_videos_status ON flagged_videos(status);
CREATE INDEX idx_flagged_videos_created_at ON flagged_videos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE flagged_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_videos ENABLE ROW LEVEL SECURITY;

-- Policies for flagged_comments
CREATE POLICY "Allow users to flag comments" ON flagged_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to read flags" ON flagged_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow channel owners to update flags" ON flagged_comments
  FOR UPDATE
  USING (true);

-- Policies for flagged_videos
CREATE POLICY "Allow users to flag videos" ON flagged_videos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to read video flags" ON flagged_videos
  FOR SELECT
  USING (true);

CREATE POLICY "Allow channel owners to update video flags" ON flagged_videos
  FOR UPDATE
  USING (true);
