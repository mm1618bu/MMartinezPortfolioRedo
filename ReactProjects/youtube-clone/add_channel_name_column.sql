-- Add channel_name column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS channel_name TEXT DEFAULT 'My Channel';

-- Update existing videos to have a default channel name if they don't have one
UPDATE videos SET channel_name = 'My Channel' WHERE channel_name IS NULL;
