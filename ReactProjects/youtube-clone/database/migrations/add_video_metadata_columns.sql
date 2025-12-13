-- Add video metadata columns to videos table
-- Run this in your Supabase SQL Editor

-- Add metadata columns for video properties
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT,
ADD COLUMN IF NOT EXISTS quality TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN videos.file_size IS 'File size in bytes';
COMMENT ON COLUMN videos.resolution IS 'Video resolution (e.g., 1920x1080)';
COMMENT ON COLUMN videos.width IS 'Video width in pixels';
COMMENT ON COLUMN videos.height IS 'Video height in pixels';
COMMENT ON COLUMN videos.aspect_ratio IS 'Video aspect ratio (e.g., 16:9, 4:3)';
COMMENT ON COLUMN videos.quality IS 'Video quality classification (e.g., 1080p, 720p, 4K)';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_videos_quality ON videos(quality);
CREATE INDEX IF NOT EXISTS idx_videos_resolution ON videos(resolution);

-- Example query to find all HD videos (1080p and above)
-- SELECT * FROM videos WHERE quality IN ('1080p', '2K', '4K', '8K');

-- Example query to find all videos in 16:9 aspect ratio
-- SELECT * FROM videos WHERE aspect_ratio = '16:9';

-- Example query to find all 4K videos that are public
-- SELECT * FROM videos WHERE quality = '4K' AND is_public = true;
