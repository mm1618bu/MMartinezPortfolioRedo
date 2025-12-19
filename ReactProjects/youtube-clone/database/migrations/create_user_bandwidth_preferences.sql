-- Create user_bandwidth_preferences table
-- Migration: create_user_bandwidth_preferences
-- Description: Creates table for user video quality and bandwidth preferences

-- ============================================
-- USER BANDWIDTH PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_bandwidth_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Quality preferences
  auto_quality BOOLEAN DEFAULT true,
  preferred_quality VARCHAR(10) DEFAULT '720p', -- '144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'
  max_quality VARCHAR(10) DEFAULT '1080p',
  
  -- Data saver mode
  data_saver_mode BOOLEAN DEFAULT false,
  
  -- Video behavior
  preload_next_video BOOLEAN DEFAULT true,
  autoplay BOOLEAN DEFAULT true,
  
  -- Bandwidth limits
  bandwidth_limit_mbps INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_preferred_quality CHECK (
    preferred_quality IN ('144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p')
  ),
  CONSTRAINT valid_max_quality CHECK (
    max_quality IN ('144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p')
  )
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_bandwidth_preferences_user_id 
  ON user_bandwidth_preferences(user_id);

-- ============================================
-- BANDWIDTH USAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bandwidth_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Quality and bandwidth info
  quality_level VARCHAR(10) NOT NULL,
  bytes_downloaded BIGINT NOT NULL,
  download_duration_seconds INTEGER NOT NULL,
  average_speed_kbps INTEGER,
  
  -- Performance metrics
  buffering_events INTEGER DEFAULT 0,
  quality_switches INTEGER DEFAULT 0,
  
  -- Timestamp
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_quality_level CHECK (
    quality_level IN ('144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p')
  )
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_user_id 
  ON bandwidth_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_video_id 
  ON bandwidth_usage_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_session_date 
  ON bandwidth_usage_logs(session_date DESC);

-- Composite index for user analytics
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_user_date 
  ON bandwidth_usage_logs(user_id, session_date DESC);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function: Get optimal quality for bandwidth
CREATE OR REPLACE FUNCTION get_optimal_quality_for_bandwidth(
  p_bandwidth_kbps INTEGER,
  p_user_id UUID DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_quality VARCHAR(10);
  v_data_saver BOOLEAN;
BEGIN
  -- Get user preferences if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT max_quality, data_saver_mode 
    INTO v_max_quality, v_data_saver
    FROM user_bandwidth_preferences
    WHERE user_id = p_user_id;
    
    -- Apply data saver mode
    IF v_data_saver THEN
      p_bandwidth_kbps := p_bandwidth_kbps / 2; -- Reduce bandwidth by half in data saver mode
    END IF;
  END IF;
  
  -- Determine optimal quality based on bandwidth
  IF p_bandwidth_kbps >= 35000 THEN RETURN '2160p';
  ELSIF p_bandwidth_kbps >= 16000 THEN RETURN '1440p';
  ELSIF p_bandwidth_kbps >= 8000 THEN RETURN '1080p';
  ELSIF p_bandwidth_kbps >= 5000 THEN RETURN '720p';
  ELSIF p_bandwidth_kbps >= 2500 THEN RETURN '480p';
  ELSIF p_bandwidth_kbps >= 1000 THEN RETURN '360p';
  ELSIF p_bandwidth_kbps >= 500 THEN RETURN '240p';
  ELSE RETURN '144p';
  END IF;
END;
$$;

-- Function: Calculate bandwidth saved
CREATE OR REPLACE FUNCTION calculate_bandwidth_saved(p_user_id UUID)
RETURNS TABLE (
  total_bytes_saved BIGINT,
  total_mb_saved NUMERIC,
  total_gb_saved NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified calculation
  -- In reality, you'd compare actual usage vs. what would have been used at max quality
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bytes_downloaded * 0.3), 0)::BIGINT as total_bytes_saved,
    ROUND(COALESCE(SUM(bytes_downloaded * 0.3), 0) / 1024.0 / 1024.0, 2) as total_mb_saved,
    ROUND(COALESCE(SUM(bytes_downloaded * 0.3), 0) / 1024.0 / 1024.0 / 1024.0, 2) as total_gb_saved
  FROM bandwidth_usage_logs
  WHERE user_id = p_user_id
    AND session_date >= NOW() - INTERVAL '30 days';
END;
$$;

-- Function: Get user bandwidth stats
CREATE OR REPLACE FUNCTION get_user_bandwidth_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_gb NUMERIC,
  avg_quality VARCHAR,
  total_sessions INTEGER,
  avg_speed_kbps INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(COALESCE(SUM(bytes_downloaded), 0) / 1024.0 / 1024.0 / 1024.0, 2) as total_gb,
    MODE() WITHIN GROUP (ORDER BY quality_level) as avg_quality,
    COUNT(*)::INTEGER as total_sessions,
    ROUND(AVG(average_speed_kbps))::INTEGER as avg_speed_kbps
  FROM bandwidth_usage_logs
  WHERE user_id = p_user_id
    AND session_date >= NOW() - INTERVAL '1 day' * p_days;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update user_bandwidth_preferences updated_at
CREATE OR REPLACE FUNCTION update_bandwidth_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bandwidth_preferences_updated
  BEFORE UPDATE ON user_bandwidth_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_bandwidth_preferences_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_bandwidth_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandwidth_usage_logs ENABLE ROW LEVEL SECURITY;

-- User bandwidth preferences policies
CREATE POLICY "Users can view their own bandwidth preferences"
  ON user_bandwidth_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bandwidth preferences"
  ON user_bandwidth_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bandwidth preferences"
  ON user_bandwidth_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bandwidth usage logs policies
CREATE POLICY "Users can view their own bandwidth logs"
  ON bandwidth_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bandwidth logs"
  ON bandwidth_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_bandwidth_preferences IS 'Stores user preferences for video quality and bandwidth usage';
COMMENT ON TABLE bandwidth_usage_logs IS 'Logs user bandwidth usage for analytics';

COMMENT ON COLUMN user_bandwidth_preferences.auto_quality IS 'Whether to automatically select quality based on bandwidth';
COMMENT ON COLUMN user_bandwidth_preferences.preferred_quality IS 'User preferred video quality when not using auto';
COMMENT ON COLUMN user_bandwidth_preferences.max_quality IS 'Maximum quality to use even with auto quality';
COMMENT ON COLUMN user_bandwidth_preferences.data_saver_mode IS 'Reduces quality to save bandwidth';
COMMENT ON COLUMN user_bandwidth_preferences.autoplay IS 'Whether videos should autoplay when opened. Default: true';
COMMENT ON COLUMN user_bandwidth_preferences.bandwidth_limit_mbps IS 'User-defined bandwidth limit in Mbps';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default bandwidth preferences for existing users
INSERT INTO user_bandwidth_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_bandwidth_preferences)
ON CONFLICT (user_id) DO NOTHING;
