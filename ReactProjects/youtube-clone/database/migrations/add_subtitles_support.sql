-- Migration: Add subtitles/captions support to videos
-- Date: 2025-12-13

-- Create subtitles table
CREATE TABLE IF NOT EXISTS subtitles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL, -- e.g., 'en', 'es', 'fr'
  label VARCHAR(100) NOT NULL, -- e.g., 'English', 'Spanish', 'French'
  subtitle_url TEXT NOT NULL, -- URL to the subtitle file (VTT format)
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subtitles_video_id ON subtitles(video_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_language ON subtitles(language);

-- Add RLS policies
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view subtitles for public videos
CREATE POLICY "Public subtitles are viewable by everyone"
ON subtitles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = subtitles.video_id 
    AND videos.is_public = true
  )
);

-- Policy: Video owner can manage their subtitles
CREATE POLICY "Users can manage subtitles for their videos"
ON subtitles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM videos 
    WHERE videos.id = subtitles.video_id 
    AND videos.user_id = auth.uid()
  )
);

-- Add comments
COMMENT ON TABLE subtitles IS 'Stores subtitle/caption files for videos';
COMMENT ON COLUMN subtitles.language IS 'ISO 639-1 language code';
COMMENT ON COLUMN subtitles.label IS 'Human-readable language name';
COMMENT ON COLUMN subtitles.subtitle_url IS 'URL to VTT subtitle file in storage';
COMMENT ON COLUMN subtitles.is_default IS 'Whether this is the default subtitle track';
