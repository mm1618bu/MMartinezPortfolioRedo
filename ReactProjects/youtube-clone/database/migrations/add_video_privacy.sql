-- Add is_public column to videos table for privacy control
-- Run this in your Supabase SQL Editor

-- Add is_public column (defaults to true for existing videos)
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for better query performance when filtering by privacy
CREATE INDEX IF NOT EXISTS idx_videos_is_public ON videos(is_public);

-- Add comment to document the column
COMMENT ON COLUMN videos.is_public IS 'Privacy setting: true = public (everyone can watch), false = private (only owner can watch)';

-- Update RLS policies to respect privacy settings
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "videos_select_policy" ON videos;
DROP POLICY IF EXISTS "videos_insert_policy" ON videos;
DROP POLICY IF EXISTS "videos_update_policy" ON videos;
DROP POLICY IF EXISTS "videos_delete_policy" ON videos;

-- Create new policies with privacy control

-- SELECT: Allow viewing public videos OR own private videos
CREATE POLICY "videos_select_policy" ON videos
  FOR SELECT
  USING (
    is_public = true 
    OR 
    auth.uid()::text = user_id
  );

-- INSERT: Authenticated users can insert videos
CREATE POLICY "videos_insert_policy" ON videos
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: Users can update their own videos
CREATE POLICY "videos_update_policy" ON videos
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- DELETE: Users can delete their own videos
CREATE POLICY "videos_delete_policy" ON videos
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Make sure RLS is enabled
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Note: If you don't have a user_id column yet, you may need to add it first:
-- ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id TEXT;
-- Then you'll need to populate existing videos with user_id values
