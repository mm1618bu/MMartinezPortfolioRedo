-- Fix video upload rate limiting trigger
-- The issue is that created_at column is TEXT instead of TIMESTAMPTZ
-- This causes type comparison errors

-- Step 1: Drop the existing trigger first
DROP TRIGGER IF EXISTS video_upload_rate_limit_trigger ON videos;
DROP FUNCTION IF EXISTS check_video_upload_rate_limit();

-- Step 2: Fix the created_at column type if it's TEXT
-- First, check what type it is and convert if needed
DO $$ 
BEGIN
  -- Try to alter the column type to TIMESTAMPTZ
  -- This will automatically convert ISO strings to timestamps
  ALTER TABLE videos 
    ALTER COLUMN created_at TYPE TIMESTAMPTZ 
    USING created_at::TIMESTAMPTZ;
EXCEPTION 
  WHEN undefined_column THEN
    -- If column doesn't exist, add it
    ALTER TABLE videos 
      ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  WHEN OTHERS THEN
    -- Column exists but couldn't convert, might already be correct type
    NULL;
END $$;

-- Step 3: Recreate the function with proper type handling
CREATE OR REPLACE FUNCTION check_video_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  -- Ensure created_at is set to NOW() if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;

  -- Count videos from this channel in the last hour
  -- Use channel_id if available, otherwise channel_name
  IF NEW.channel_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO upload_count
    FROM videos
    WHERE channel_id = NEW.channel_id
      AND created_at > (NOW() - INTERVAL '1 hour');
  ELSIF NEW.channel_name IS NOT NULL THEN
    SELECT COUNT(*)
    INTO upload_count
    FROM videos
    WHERE channel_name = NEW.channel_name
      AND created_at > (NOW() - INTERVAL '1 hour');
  ELSE
    -- No channel identifier, allow upload
    RETURN NEW;
  END IF;
  
  -- If 10 or more uploads in last hour, reject
  IF upload_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 10 video uploads per hour. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
CREATE TRIGGER video_upload_rate_limit_trigger
  BEFORE INSERT ON videos
  FOR EACH ROW
  EXECUTE FUNCTION check_video_upload_rate_limit();

-- Verification query - run this to check the column type
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'videos' AND column_name = 'created_at';
