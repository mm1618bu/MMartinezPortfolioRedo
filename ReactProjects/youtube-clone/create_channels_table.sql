-- Create channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  subscriber_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_channel UNIQUE(user_id)
);

-- Create index on user_id for faster queries
CREATE INDEX idx_channels_user_id ON channels(user_id);

-- Create index on channel_name for faster lookups
CREATE INDEX idx_channels_channel_name ON channels(channel_name);

-- Enable Row Level Security
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to channels" ON channels
  FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert their own channel" ON channels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own channel" ON channels
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own channel" ON channels
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add channel_id to videos table (optional - for linking videos to channels)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE SET NULL;

-- Create index on channel_id in videos table
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
