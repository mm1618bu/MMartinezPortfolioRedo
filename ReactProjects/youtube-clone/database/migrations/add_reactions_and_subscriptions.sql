-- ================================================
-- VIDEO REACTIONS TABLE (LIKES/DISLIKES)
-- ================================================

-- Create video_reactions table
CREATE TABLE IF NOT EXISTS video_reactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_reactions_user_id ON video_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_video_id ON video_reactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_type ON video_reactions(reaction_type);

-- Enable Row Level Security
ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_reactions
-- Allow users to read all reactions
CREATE POLICY "Anyone can view video reactions"
  ON video_reactions FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own reactions
CREATE POLICY "Users can add their own reactions"
  ON video_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reactions
CREATE POLICY "Users can update their own reactions"
  ON video_reactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON video_reactions FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- CHANNEL SUBSCRIPTIONS TABLE
-- ================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id INTEGER NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel_id ON subscriptions(channel_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Allow users to read all subscriptions (to show subscriber counts)
CREATE POLICY "Anyone can view subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

-- Allow authenticated users to subscribe
CREATE POLICY "Users can subscribe to channels"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to unsubscribe
CREATE POLICY "Users can unsubscribe from channels"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);


-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for video_reactions updated_at
CREATE TRIGGER update_video_reactions_updated_at
  BEFORE UPDATE ON video_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ================================================
-- HELPFUL VIEWS (OPTIONAL)
-- ================================================

-- View to get video reaction counts
CREATE OR REPLACE VIEW video_reaction_counts AS
SELECT 
  video_id,
  COUNT(*) FILTER (WHERE reaction_type = 'like') AS likes,
  COUNT(*) FILTER (WHERE reaction_type = 'dislike') AS dislikes,
  COUNT(*) AS total_reactions
FROM video_reactions
GROUP BY video_id;

-- View to get channel subscriber counts
CREATE OR REPLACE VIEW channel_subscriber_counts AS
SELECT 
  channel_id,
  COUNT(*) AS subscriber_count
FROM subscriptions
GROUP BY channel_id;


-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON video_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON subscriptions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE video_reactions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE subscriptions_id_seq TO authenticated;


-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE video_reactions IS 'Stores user reactions (likes/dislikes) for videos';
COMMENT ON TABLE subscriptions IS 'Stores user subscriptions to channels';
COMMENT ON COLUMN video_reactions.reaction_type IS 'Type of reaction: like or dislike';
COMMENT ON VIEW video_reaction_counts IS 'Aggregated counts of likes and dislikes per video';
COMMENT ON VIEW channel_subscriber_counts IS 'Aggregated subscriber counts per channel';
