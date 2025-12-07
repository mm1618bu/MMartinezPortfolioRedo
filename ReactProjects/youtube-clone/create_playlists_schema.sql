-- ============================================
-- PLAYLIST SCHEMA FOR YOUTUBE CLONE
-- ============================================

-- 1. CREATE PLAYLISTS TABLE
-- Stores playlist metadata
-- ============================================

CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- User/channel who created the playlist
  channel_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT, -- Optional custom thumbnail or first video thumbnail
  is_public BOOLEAN DEFAULT true,
  video_count INTEGER DEFAULT 0, -- Cached count for performance
  total_views INTEGER DEFAULT 0, -- Sum of all video views in playlist
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_playlists_channel_name ON playlists(channel_name);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public);


-- ============================================
-- 2. CREATE PLAYLIST_VIDEOS TABLE
-- Junction table linking playlists to videos
-- ============================================

CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL, -- References videos.id
  position INTEGER NOT NULL, -- Order in playlist (0-based)
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT, -- User who added the video
  
  -- Ensure unique video per playlist
  UNIQUE(playlist_id, video_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_added_at ON playlist_videos(added_at DESC);


-- ============================================
-- 3. CREATE PLAYLIST_LIKES TABLE (OPTIONAL)
-- Track users who liked/saved playlists
-- ============================================

CREATE TABLE IF NOT EXISTS playlist_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- User ID, email, or session
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can only like playlist once
  UNIQUE(playlist_id, user_identifier)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_playlist_likes_playlist_id ON playlist_likes(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_likes_user ON playlist_likes(user_identifier);


-- ============================================
-- 4. AUTO-UPDATE FUNCTIONS
-- Keep playlist metadata in sync
-- ============================================

-- Function to update playlist video count
CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE playlists 
    SET video_count = video_count + 1,
        updated_at = NOW()
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE playlists 
    SET video_count = GREATEST(0, video_count - 1),
        updated_at = NOW()
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update video count
DROP TRIGGER IF EXISTS playlist_video_count_trigger ON playlist_videos;
CREATE TRIGGER playlist_video_count_trigger
  AFTER INSERT OR DELETE ON playlist_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_video_count();


-- Function to update playlist updated_at timestamp
CREATE OR REPLACE FUNCTION update_playlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on playlist changes
DROP TRIGGER IF EXISTS playlist_timestamp_trigger ON playlists;
CREATE TRIGGER playlist_timestamp_trigger
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_timestamp();


-- Function to reorder playlist videos after deletion
CREATE OR REPLACE FUNCTION reorder_playlist_videos()
RETURNS TRIGGER AS $$
BEGIN
  -- Update positions of videos after the deleted one
  UPDATE playlist_videos
  SET position = position - 1
  WHERE playlist_id = OLD.playlist_id
    AND position > OLD.position;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reorder after deletion
DROP TRIGGER IF EXISTS reorder_playlist_trigger ON playlist_videos;
CREATE TRIGGER reorder_playlist_trigger
  AFTER DELETE ON playlist_videos
  FOR EACH ROW
  EXECUTE FUNCTION reorder_playlist_videos();


-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on playlists table
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public playlists
CREATE POLICY "Allow public read access to public playlists" ON playlists
  FOR SELECT
  USING (is_public = true);

-- Policy: Allow all operations for development (temporary)
CREATE POLICY "Allow all operations on playlists" ON playlists
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS on playlist_videos
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read if playlist is public
CREATE POLICY "Allow read access to playlist videos" ON playlist_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_videos.playlist_id
        AND playlists.is_public = true
    )
  );

-- Policy: Allow all operations for development (temporary)
CREATE POLICY "Allow all operations on playlist_videos" ON playlist_videos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS on playlist_likes
ALTER TABLE playlist_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for development (temporary)
CREATE POLICY "Allow all operations on playlist_likes" ON playlist_likes
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to add video to playlist
CREATE OR REPLACE FUNCTION add_video_to_playlist(
  p_playlist_id UUID,
  p_video_id TEXT,
  p_added_by TEXT DEFAULT NULL
)
RETURNS playlist_videos AS $$
DECLARE
  next_position INTEGER;
  new_record playlist_videos;
BEGIN
  -- Get next position (last position + 1)
  SELECT COALESCE(MAX(position), -1) + 1
  INTO next_position
  FROM playlist_videos
  WHERE playlist_id = p_playlist_id;
  
  -- Insert video at the end
  INSERT INTO playlist_videos (playlist_id, video_id, position, added_by)
  VALUES (p_playlist_id, p_video_id, next_position, p_added_by)
  RETURNING * INTO new_record;
  
  RETURN new_record;
END;
$$ LANGUAGE plpgsql;


-- Function to remove video from playlist
CREATE OR REPLACE FUNCTION remove_video_from_playlist(
  p_playlist_id UUID,
  p_video_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM playlist_videos
  WHERE playlist_id = p_playlist_id
    AND video_id = p_video_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;


-- Function to reorder video in playlist
CREATE OR REPLACE FUNCTION move_video_in_playlist(
  p_playlist_id UUID,
  p_video_id TEXT,
  p_new_position INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  old_position INTEGER;
BEGIN
  -- Get current position
  SELECT position INTO old_position
  FROM playlist_videos
  WHERE playlist_id = p_playlist_id
    AND video_id = p_video_id;
  
  IF old_position IS NULL THEN
    RETURN false;
  END IF;
  
  -- If moving down, shift videos up
  IF p_new_position > old_position THEN
    UPDATE playlist_videos
    SET position = position - 1
    WHERE playlist_id = p_playlist_id
      AND position > old_position
      AND position <= p_new_position;
  -- If moving up, shift videos down
  ELSIF p_new_position < old_position THEN
    UPDATE playlist_videos
    SET position = position + 1
    WHERE playlist_id = p_playlist_id
      AND position >= p_new_position
      AND position < old_position;
  END IF;
  
  -- Update the video position
  UPDATE playlist_videos
  SET position = p_new_position
  WHERE playlist_id = p_playlist_id
    AND video_id = p_video_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;


-- Function to get playlist with video details
CREATE OR REPLACE FUNCTION get_playlist_with_videos(p_playlist_id UUID)
RETURNS TABLE (
  playlist_id UUID,
  playlist_title TEXT,
  playlist_description TEXT,
  playlist_thumbnail TEXT,
  video_id TEXT,
  video_position INTEGER,
  video_added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS playlist_id,
    p.title AS playlist_title,
    p.description AS playlist_description,
    p.thumbnail_url AS playlist_thumbnail,
    pv.video_id,
    pv.position AS video_position,
    pv.added_at AS video_added_at
  FROM playlists p
  LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
  WHERE p.id = p_playlist_id
  ORDER BY pv.position;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- USAGE EXAMPLES:
-- ============================================

-- Create a playlist
-- INSERT INTO playlists (channel_name, title, description, is_public)
-- VALUES ('My Channel', 'My Favorite Videos', 'A collection of my favorites', true);

-- Add video to playlist using helper function
-- SELECT add_video_to_playlist('playlist-uuid', 'video-id-123', 'user@example.com');

-- Remove video from playlist
-- SELECT remove_video_from_playlist('playlist-uuid', 'video-id-123');

-- Move video to different position
-- SELECT move_video_in_playlist('playlist-uuid', 'video-id-123', 2);

-- Get playlist with all videos
-- SELECT * FROM get_playlist_with_videos('playlist-uuid');

-- Get all playlists for a channel
-- SELECT * FROM playlists WHERE channel_name = 'My Channel' ORDER BY created_at DESC;

-- Get all videos in a playlist (ordered)
-- SELECT pv.*, v.*
-- FROM playlist_videos pv
-- JOIN videos v ON pv.video_id = v.id
-- WHERE pv.playlist_id = 'playlist-uuid'
-- ORDER BY pv.position;
