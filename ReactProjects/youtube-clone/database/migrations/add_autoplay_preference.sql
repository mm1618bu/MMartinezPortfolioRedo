-- Add autoplay preference to user_bandwidth_preferences table
-- Migration: add_autoplay_preference
-- Description: Adds autoplay column to allow users to control video autoplay behavior

-- Add autoplay column (defaults to true for backward compatibility)
ALTER TABLE user_bandwidth_preferences 
ADD COLUMN IF NOT EXISTS autoplay BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN user_bandwidth_preferences.autoplay IS 'Whether videos should autoplay when opened. Default: true';

-- Update existing rows to have autoplay enabled (if they were created before this migration)
UPDATE user_bandwidth_preferences 
SET autoplay = true 
WHERE autoplay IS NULL;
