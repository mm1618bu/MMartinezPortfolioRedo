-- Add channel settings columns to channels table
-- Run this in your Supabase SQL Editor

-- Add general settings columns
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add privacy settings columns
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS default_video_privacy TEXT DEFAULT 'public' CHECK (default_video_privacy IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS show_subscriber_count BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_ratings BOOLEAN DEFAULT true;

-- Add notification settings columns
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comment_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS like_notifications BOOLEAN DEFAULT false;

-- Add comments to document the columns
COMMENT ON COLUMN channels.contact_email IS 'Business contact email for the channel';
COMMENT ON COLUMN channels.website IS 'Channel website or social media URL';
COMMENT ON COLUMN channels.default_video_privacy IS 'Default privacy setting for new video uploads';
COMMENT ON COLUMN channels.show_subscriber_count IS 'Whether to display subscriber count publicly';
COMMENT ON COLUMN channels.allow_comments IS 'Whether to allow comments on videos';
COMMENT ON COLUMN channels.allow_ratings IS 'Whether to allow likes/dislikes on videos';
COMMENT ON COLUMN channels.email_notifications IS 'Master toggle for email notifications';
COMMENT ON COLUMN channels.comment_notifications IS 'Notify when someone comments';
COMMENT ON COLUMN channels.subscription_notifications IS 'Notify when someone subscribes';
COMMENT ON COLUMN channels.like_notifications IS 'Notify when someone likes a video';

-- Create index for privacy queries
CREATE INDEX IF NOT EXISTS idx_channels_default_privacy ON channels(default_video_privacy);

-- Example queries:

-- Get all channels with public default privacy
-- SELECT * FROM channels WHERE default_video_privacy = 'public';

-- Get channels that allow comments
-- SELECT * FROM channels WHERE allow_comments = true;

-- Update channel settings
-- UPDATE channels 
-- SET 
--   contact_email = 'contact@example.com',
--   website = 'https://example.com',
--   allow_comments = true,
--   show_subscriber_count = true
-- WHERE id = 'your-channel-id';
