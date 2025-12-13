-- Migration: Add Video Compression & Quality Support
-- Description: Adds tables and functions for managing multiple video quality levels,
--              compression metadata, and adaptive bitrate streaming

-- =====================================================
-- 1. Video Quality Variants Table
-- =====================================================
-- Stores different quality versions of the same video
CREATE TABLE IF NOT EXISTS video_quality_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  quality_level VARCHAR(10) NOT NULL, -- '144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'
  resolution_width INT NOT NULL,
  resolution_height INT NOT NULL,
  bitrate_kbps INT NOT NULL, -- Video bitrate in kbps
  file_size_bytes BIGINT NOT NULL,
  codec VARCHAR(20) NOT NULL, -- 'h264', 'h265', 'vp9', 'av1'
  file_url TEXT NOT NULL,
  is_ready BOOLEAN DEFAULT false, -- True when encoding is complete
  encoding_progress INT DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_quality_variants_video_id ON video_quality_variants(video_id);
CREATE INDEX idx_video_quality_variants_quality ON video_quality_variants(quality_level);
CREATE INDEX idx_video_quality_variants_ready ON video_quality_variants(is_ready);
CREATE UNIQUE INDEX idx_video_quality_unique ON video_quality_variants(video_id, quality_level);

-- =====================================================
-- 2. Video Compression Metadata
-- =====================================================
-- Stores compression settings and metrics for videos
CREATE TABLE IF NOT EXISTS video_compression_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  original_file_size_bytes BIGINT NOT NULL,
  compressed_file_size_bytes BIGINT NOT NULL,
  compression_ratio DECIMAL(5,2) NOT NULL, -- Percentage saved
  original_bitrate_kbps INT NOT NULL,
  target_bitrate_kbps INT NOT NULL,
  codec_used VARCHAR(20) NOT NULL,
  preset VARCHAR(20) NOT NULL, -- 'ultrafast', 'fast', 'medium', 'slow', etc.
  crf_value INT, -- Constant Rate Factor (quality setting)
  audio_bitrate_kbps INT NOT NULL,
  audio_codec VARCHAR(20) NOT NULL, -- 'aac', 'opus', 'mp3'
  processing_time_seconds INT NOT NULL,
  compression_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_compression_metadata_video_id ON video_compression_metadata(video_id);
CREATE INDEX idx_compression_metadata_date ON video_compression_metadata(compression_date);

-- =====================================================
-- 3. User Bandwidth Preferences
-- =====================================================
-- Stores user preferences for video quality and data usage
CREATE TABLE IF NOT EXISTS user_bandwidth_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_quality BOOLEAN DEFAULT true, -- Auto-adjust quality based on bandwidth
  preferred_quality VARCHAR(10) DEFAULT '720p', -- Default quality preference
  max_quality VARCHAR(10) DEFAULT '1080p', -- Maximum quality allowed
  data_saver_mode BOOLEAN DEFAULT false, -- Reduces quality to save data
  preload_next_video BOOLEAN DEFAULT true, -- Preload next video in playlist
  bandwidth_limit_mbps DECIMAL(6,2), -- Optional bandwidth cap (null = unlimited)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_user_bandwidth_prefs_user_id ON user_bandwidth_preferences(user_id);

-- =====================================================
-- 4. Bandwidth Usage Logs
-- =====================================================
-- Tracks actual bandwidth usage per user for analytics
CREATE TABLE IF NOT EXISTS bandwidth_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  quality_level VARCHAR(10) NOT NULL,
  bytes_downloaded BIGINT NOT NULL,
  download_duration_seconds INT NOT NULL,
  average_speed_kbps INT NOT NULL,
  buffering_events INT DEFAULT 0, -- Number of times video buffered
  quality_switches INT DEFAULT 0, -- Number of quality changes during playback
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bandwidth_usage_user_id ON bandwidth_usage_logs(user_id);
CREATE INDEX idx_bandwidth_usage_video_id ON bandwidth_usage_logs(video_id);
CREATE INDEX idx_bandwidth_usage_date ON bandwidth_usage_logs(session_date);

-- =====================================================
-- 5. Image Optimization Metadata
-- =====================================================
-- Stores information about optimized thumbnail/image variants
CREATE TABLE IF NOT EXISTS image_optimization_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_image_url TEXT NOT NULL,
  optimized_image_url TEXT NOT NULL,
  image_type VARCHAR(20) NOT NULL, -- 'thumbnail', 'banner', 'avatar', 'poster'
  format VARCHAR(10) NOT NULL, -- 'webp', 'avif', 'jpg', 'png'
  width INT NOT NULL,
  height INT NOT NULL,
  file_size_bytes INT NOT NULL,
  quality INT NOT NULL, -- 1-100
  compression_ratio DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_image_optimization_original ON image_optimization_metadata(original_image_url);
CREATE INDEX idx_image_optimization_type ON image_optimization_metadata(image_type);

-- =====================================================
-- 6. Functions
-- =====================================================

-- Function: Get optimal quality for user's bandwidth
CREATE OR REPLACE FUNCTION get_optimal_quality_for_bandwidth(
  p_bandwidth_kbps INT,
  p_user_id UUID DEFAULT NULL
)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_optimal_quality VARCHAR(10);
  v_max_quality VARCHAR(10);
  v_data_saver BOOLEAN;
BEGIN
  -- Get user preferences if available
  IF p_user_id IS NOT NULL THEN
    SELECT max_quality, data_saver_mode
    INTO v_max_quality, v_data_saver
    FROM user_bandwidth_preferences
    WHERE user_id = p_user_id;
  END IF;

  -- Default values if no preferences found
  v_max_quality := COALESCE(v_max_quality, '1080p');
  v_data_saver := COALESCE(v_data_saver, false);

  -- Determine optimal quality based on bandwidth
  -- Add 25% buffer to ensure smooth playback
  IF v_data_saver THEN
    -- Data saver mode: use lower quality
    IF p_bandwidth_kbps >= 3000 THEN v_optimal_quality := '480p';
    ELSIF p_bandwidth_kbps >= 1500 THEN v_optimal_quality := '360p';
    ELSIF p_bandwidth_kbps >= 700 THEN v_optimal_quality := '240p';
    ELSE v_optimal_quality := '144p';
    END IF;
  ELSE
    -- Normal mode: match quality to bandwidth
    IF p_bandwidth_kbps >= 25000 THEN v_optimal_quality := '2160p'; -- 4K
    ELSIF p_bandwidth_kbps >= 12000 THEN v_optimal_quality := '1440p'; -- 2K
    ELSIF p_bandwidth_kbps >= 6000 THEN v_optimal_quality := '1080p'; -- Full HD
    ELSIF p_bandwidth_kbps >= 3000 THEN v_optimal_quality := '720p'; -- HD
    ELSIF p_bandwidth_kbps >= 1500 THEN v_optimal_quality := '480p'; -- SD
    ELSIF p_bandwidth_kbps >= 700 THEN v_optimal_quality := '360p';
    ELSIF p_bandwidth_kbps >= 350 THEN v_optimal_quality := '240p';
    ELSE v_optimal_quality := '144p';
    END IF;
  END IF;

  -- Respect user's max quality preference
  -- Quality order: 144p < 240p < 360p < 480p < 720p < 1080p < 1440p < 2160p
  IF v_max_quality = '144p' THEN
    v_optimal_quality := LEAST(v_optimal_quality, '144p');
  ELSIF v_max_quality = '240p' AND v_optimal_quality NOT IN ('144p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '240p');
  ELSIF v_max_quality = '360p' AND v_optimal_quality NOT IN ('144p', '240p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '360p');
  ELSIF v_max_quality = '480p' AND v_optimal_quality NOT IN ('144p', '240p', '360p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '480p');
  ELSIF v_max_quality = '720p' AND v_optimal_quality NOT IN ('144p', '240p', '360p', '480p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '720p');
  ELSIF v_max_quality = '1080p' AND v_optimal_quality NOT IN ('144p', '240p', '360p', '480p', '720p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '1080p');
  ELSIF v_max_quality = '1440p' AND v_optimal_quality NOT IN ('144p', '240p', '360p', '480p', '720p', '1080p') THEN
    v_optimal_quality := LEAST(v_optimal_quality, '1440p');
  END IF;

  RETURN v_optimal_quality;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate total bandwidth saved
CREATE OR REPLACE FUNCTION calculate_bandwidth_saved(p_user_id UUID)
RETURNS TABLE(
  total_bytes_saved BIGINT,
  total_mb_saved DECIMAL(10,2),
  total_gb_saved DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(
      -- Estimate bytes that would have been used at max quality
      CASE
        WHEN quality_level = '144p' THEN bytes_downloaded * 15
        WHEN quality_level = '240p' THEN bytes_downloaded * 10
        WHEN quality_level = '360p' THEN bytes_downloaded * 6
        WHEN quality_level = '480p' THEN bytes_downloaded * 4
        WHEN quality_level = '720p' THEN bytes_downloaded * 2
        WHEN quality_level = '1080p' THEN bytes_downloaded * 1.5
        ELSE bytes_downloaded
      END - bytes_downloaded
    ), 0) AS total_bytes_saved,
    ROUND(COALESCE(SUM(
      CASE
        WHEN quality_level = '144p' THEN bytes_downloaded * 15
        WHEN quality_level = '240p' THEN bytes_downloaded * 10
        WHEN quality_level = '360p' THEN bytes_downloaded * 6
        WHEN quality_level = '480p' THEN bytes_downloaded * 4
        WHEN quality_level = '720p' THEN bytes_downloaded * 2
        WHEN quality_level = '1080p' THEN bytes_downloaded * 1.5
        ELSE bytes_downloaded
      END - bytes_downloaded
    ), 0) / 1048576.0, 2) AS total_mb_saved,
    ROUND(COALESCE(SUM(
      CASE
        WHEN quality_level = '144p' THEN bytes_downloaded * 15
        WHEN quality_level = '240p' THEN bytes_downloaded * 10
        WHEN quality_level = '360p' THEN bytes_downloaded * 6
        WHEN quality_level = '480p' THEN bytes_downloaded * 4
        WHEN quality_level = '720p' THEN bytes_downloaded * 2
        WHEN quality_level = '1080p' THEN bytes_downloaded * 1.5
        ELSE bytes_downloaded
      END - bytes_downloaded
    ), 0) / 1073741824.0, 2) AS total_gb_saved
  FROM bandwidth_usage_logs
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Row Level Security (RLS)
-- =====================================================

ALTER TABLE video_quality_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_compression_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bandwidth_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandwidth_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_optimization_metadata ENABLE ROW LEVEL SECURITY;

-- Video quality variants: Public read for public videos, owners can manage
CREATE POLICY "Public videos quality variants are viewable by everyone"
  ON video_quality_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_quality_variants.video_id
      AND videos.is_public = true
    )
  );

CREATE POLICY "Users can manage quality variants for their videos"
  ON video_quality_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_quality_variants.video_id
      AND videos.channel_name = (SELECT raw_user_meta_data->>'channel_name' FROM auth.users WHERE id = auth.uid())
    )
  );

-- Compression metadata: Public read, owners can manage
CREATE POLICY "Compression metadata is viewable by everyone"
  ON video_compression_metadata FOR SELECT
  USING (true);

CREATE POLICY "Users can manage compression metadata for their videos"
  ON video_compression_metadata FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = video_compression_metadata.video_id
      AND videos.channel_name = (SELECT raw_user_meta_data->>'channel_name' FROM auth.users WHERE id = auth.uid())
    )
  );

-- Bandwidth preferences: Users can only see/edit their own
CREATE POLICY "Users can view their own bandwidth preferences"
  ON user_bandwidth_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bandwidth preferences"
  ON user_bandwidth_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Bandwidth logs: Users can only see their own
CREATE POLICY "Users can view their own bandwidth logs"
  ON bandwidth_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bandwidth logs"
  ON bandwidth_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Image optimization: Public read
CREATE POLICY "Image optimization metadata is viewable by everyone"
  ON image_optimization_metadata FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add image optimization metadata"
  ON image_optimization_metadata FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. Triggers
-- =====================================================

-- Update timestamp on quality variants update
CREATE OR REPLACE FUNCTION update_quality_variant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quality_variant_timestamp_trigger
BEFORE UPDATE ON video_quality_variants
FOR EACH ROW
EXECUTE FUNCTION update_quality_variant_timestamp();

-- Update timestamp on bandwidth preferences update
CREATE OR REPLACE FUNCTION update_bandwidth_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bandwidth_prefs_timestamp_trigger
BEFORE UPDATE ON user_bandwidth_preferences
FOR EACH ROW
EXECUTE FUNCTION update_bandwidth_prefs_timestamp();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE video_quality_variants IS 'Stores multiple quality versions of videos for adaptive bitrate streaming';
COMMENT ON TABLE video_compression_metadata IS 'Tracks compression settings and metrics for video processing';
COMMENT ON TABLE user_bandwidth_preferences IS 'User preferences for video quality and data usage';
COMMENT ON TABLE bandwidth_usage_logs IS 'Logs actual bandwidth usage for analytics and optimization';
COMMENT ON TABLE image_optimization_metadata IS 'Metadata for optimized image variants (WebP, AVIF, etc.)';

COMMENT ON FUNCTION get_optimal_quality_for_bandwidth IS 'Returns the optimal video quality level based on available bandwidth and user preferences';
COMMENT ON FUNCTION calculate_bandwidth_saved IS 'Calculates total data saved by using lower quality settings';
