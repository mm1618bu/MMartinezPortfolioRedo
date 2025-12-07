-- ============================================
-- DATABASE RATE LIMITING FOR YOUTUBE CLONE
-- ============================================

-- 1. COMMENT RATE LIMITING
-- Prevents users from posting more than 5 comments per minute
-- ============================================

CREATE OR REPLACE FUNCTION check_comment_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  comment_count INTEGER;
BEGIN
  -- Count comments from this user in the last minute
  SELECT COUNT(*)
  INTO comment_count
  FROM comments
  WHERE user_name = NEW.user_name
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- If 5 or more comments in last minute, reject
  IF comment_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 comments per minute. Please wait before commenting again.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to comments table
DROP TRIGGER IF EXISTS comment_rate_limit_trigger ON comments;
CREATE TRIGGER comment_rate_limit_trigger
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION check_comment_rate_limit();


-- ============================================
-- 2. VIDEO UPLOAD RATE LIMITING
-- Prevents users from uploading more than 10 videos per hour
-- ============================================

CREATE OR REPLACE FUNCTION check_video_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  -- Count videos from this channel in the last hour
  SELECT COUNT(*)
  INTO upload_count
  FROM videos
  WHERE channel_name = NEW.channel_name
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- If 10 or more uploads in last hour, reject
  IF upload_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 10 video uploads per hour. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to videos table
DROP TRIGGER IF EXISTS video_upload_rate_limit_trigger ON videos;
CREATE TRIGGER video_upload_rate_limit_trigger
  BEFORE INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION check_video_upload_rate_limit();


-- ============================================
-- 3. LIKE/DISLIKE RATE LIMITING (OPTIONAL)
-- Track user interactions to prevent spam
-- First, create a table to track interactions
-- ============================================

-- Create table to track user interactions
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_identifier TEXT NOT NULL, -- Could be IP, session ID, or user ID
  interaction_type TEXT NOT NULL, -- 'like', 'dislike', 'view'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_interactions_lookup 
  ON user_interactions(user_identifier, video_id, interaction_type, created_at);

-- Function to check interaction rate limit
CREATE OR REPLACE FUNCTION check_interaction_rate_limit(
  p_video_id TEXT,
  p_user_identifier TEXT,
  p_interaction_type TEXT,
  p_max_count INTEGER,
  p_time_window INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
  interaction_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO interaction_count
  FROM user_interactions
  WHERE user_identifier = p_user_identifier
    AND interaction_type = p_interaction_type
    AND created_at > NOW() - p_time_window;
  
  RETURN interaction_count < p_max_count;
END;
$$ LANGUAGE plpgsql;

-- Function to log interaction
CREATE OR REPLACE FUNCTION log_user_interaction(
  p_video_id TEXT,
  p_user_identifier TEXT,
  p_interaction_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_interactions (video_id, user_identifier, interaction_type)
  VALUES (p_video_id, p_user_identifier, p_interaction_type);
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 4. CLEANUP OLD INTERACTION LOGS
-- Remove old logs to keep table size manageable
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_interactions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_interactions
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup
-- (Requires pg_cron extension - available in Supabase)
-- SELECT cron.schedule('cleanup-interactions', '0 2 * * *', 'SELECT cleanup_old_interactions()');


-- ============================================
-- 5. VIEW COUNT RATE LIMITING
-- Prevent view count manipulation
-- ============================================

CREATE OR REPLACE FUNCTION check_view_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  -- Count views from this IP/user for this video in last 10 minutes
  SELECT COUNT(*)
  INTO view_count
  FROM user_interactions
  WHERE video_id = NEW.video_id
    AND user_identifier = NEW.user_identifier
    AND interaction_type = 'view'
    AND created_at > NOW() - INTERVAL '10 minutes';
  
  -- Allow only 1 view per 10 minutes per user per video
  IF view_count >= 1 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Views are limited to once per 10 minutes per video';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS view_rate_limit_trigger ON user_interactions;
CREATE TRIGGER view_rate_limit_trigger
  BEFORE INSERT ON user_interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type = 'view')
  EXECUTE FUNCTION check_view_rate_limit();


-- ============================================
-- USAGE EXAMPLES:
-- ============================================

-- Check if user can like (max 50 likes per hour)
-- SELECT check_interaction_rate_limit('video_id_123', 'user_abc', 'like', 50, INTERVAL '1 hour');

-- Log a like
-- SELECT log_user_interaction('video_id_123', 'user_abc', 'like');

-- Manual cleanup
-- SELECT cleanup_old_interactions();
