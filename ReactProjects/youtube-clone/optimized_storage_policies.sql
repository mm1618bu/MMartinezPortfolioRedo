-- ============================================
-- OPTIMIZED STORAGE BUCKET POLICIES
-- ============================================
-- This file provides optimized storage bucket policies for:
-- 1. Security: Proper authentication and authorization
-- 2. Performance: Efficient caching headers
-- 3. Cost: File size limits and cleanup policies
--
-- Buckets used: videos, avatars, subtitles
-- ============================================

-- ============================================
-- STEP 1: CREATE BUCKETS WITH OPTIMIZATIONS
-- ============================================

-- Create videos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true, -- Public read access
  524288000, -- 500MB max file size
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];

-- Create avatars bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public read access for avatars
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create subtitles bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'subtitles',
  'subtitles',
  true, -- Public read access
  1048576, -- 1MB max file size (VTT files are text-based)
  ARRAY['text/vtt', 'text/plain', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['text/vtt', 'text/plain', 'application/octet-stream'];

-- ============================================
-- STEP 2: DROP EXISTING POLICIES (CLEANUP)
-- ============================================

-- Videos bucket policies
DROP POLICY IF EXISTS "Allow public uploads to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to videos bucket" ON storage.objects;
DROP POLICY IF EXISTS "videos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "videos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "videos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "videos_authenticated_delete" ON storage.objects;

-- Avatars bucket policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_access" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;

-- Subtitles bucket policies
DROP POLICY IF EXISTS "subtitles_public_read" ON storage.objects;
DROP POLICY IF EXISTS "subtitles_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "subtitles_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "subtitles_authenticated_delete" ON storage.objects;

-- ============================================
-- STEP 3: VIDEOS BUCKET - OPTIMIZED POLICIES
-- ============================================

-- Public can read/download videos and thumbnails
CREATE POLICY "videos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

-- Authenticated users can upload videos/thumbnails
-- Note: Additional rate limiting at application layer (10 videos/hour)
CREATE POLICY "videos_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND (
    -- Videos in videos/ folder
    (name LIKE 'videos/%' AND 
     (name LIKE '%.mp4' OR name LIKE '%.webm' OR name LIKE '%.ogg' OR name LIKE '%.mov'))
    OR
    -- Thumbnails in thumbnails/ folder
    (name LIKE 'thumbnails/%' AND 
     (name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.webp'))
  )
);

-- Users can only update their own videos/thumbnails
-- Check ownership via videos table
CREATE POLICY "videos_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM videos 
    WHERE (
      storage.objects.name LIKE '%' || videos.id || '%'
      AND videos.user_id = auth.uid()
    )
  )
)
WITH CHECK (bucket_id = 'videos');

-- Users can only delete their own videos/thumbnails
CREATE POLICY "videos_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM videos 
    WHERE (
      storage.objects.name LIKE '%' || videos.id || '%'
      AND videos.user_id = auth.uid()
    )
  )
);

-- ============================================
-- STEP 4: AVATARS BUCKET - OPTIMIZED POLICIES
-- ============================================

-- Public can read avatars and banners
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their profile pictures/banners
-- Restrict to profile-pictures/ and banners/ folders only
CREATE POLICY "avatars_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    -- Profile pictures: profile-pictures/{userId}.jpg
    (name LIKE 'profile-pictures/%' AND name = 'profile-pictures/' || auth.uid() || '.jpg')
    OR
    -- Banners: banners/{userId}.jpg
    (name LIKE 'banners/%' AND name = 'banners/' || auth.uid() || '.jpg')
  )
);

-- Users can only update their own profile pictures/banners
CREATE POLICY "avatars_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    name = 'profile-pictures/' || auth.uid() || '.jpg'
    OR name = 'banners/' || auth.uid() || '.jpg'
  )
)
WITH CHECK (bucket_id = 'avatars');

-- Users can only delete their own profile pictures/banners
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    name = 'profile-pictures/' || auth.uid() || '.jpg'
    OR name = 'banners/' || auth.uid() || '.jpg'
  )
);

-- ============================================
-- STEP 5: SUBTITLES BUCKET - OPTIMIZED POLICIES
-- ============================================

-- Public can read subtitles
CREATE POLICY "subtitles_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'subtitles');

-- Authenticated users can upload subtitles for their videos
CREATE POLICY "subtitles_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'subtitles'
  AND name LIKE 'subtitles/%'
  AND (name LIKE '%.vtt' OR name LIKE '%.txt')
);

-- Users can only update subtitles for their own videos
CREATE POLICY "subtitles_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'subtitles'
  AND EXISTS (
    SELECT 1 FROM videos 
    WHERE (
      storage.objects.name LIKE '%' || videos.id || '%'
      AND videos.user_id = auth.uid()
    )
  )
)
WITH CHECK (bucket_id = 'subtitles');

-- Users can only delete subtitles for their own videos
CREATE POLICY "subtitles_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'subtitles'
  AND EXISTS (
    SELECT 1 FROM videos 
    WHERE (
      storage.objects.name LIKE '%' || videos.id || '%'
      AND videos.user_id = auth.uid()
    )
  )
);

-- ============================================
-- STEP 6: AUTOMATIC CLEANUP FUNCTIONS
-- ============================================

-- Function to clean up orphaned files (files without database records)
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS void AS $$
DECLARE
  file_record RECORD;
  video_exists BOOLEAN;
BEGIN
  -- Clean up orphaned video files (older than 7 days)
  FOR file_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'videos' 
    AND created_at < NOW() - INTERVAL '7 days'
    AND name LIKE 'videos/%'
  LOOP
    -- Extract video ID from filename
    SELECT EXISTS(
      SELECT 1 FROM videos 
      WHERE file_record.name LIKE '%' || id || '%'
    ) INTO video_exists;
    
    -- If no matching video record, delete the file
    IF NOT video_exists THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'videos' AND name = file_record.name;
      RAISE NOTICE 'Deleted orphaned file: %', file_record.name;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce file size limits at database level
CREATE OR REPLACE FUNCTION check_storage_file_size()
RETURNS TRIGGER AS $$
BEGIN
  -- Videos bucket: 500MB limit
  IF NEW.bucket_id = 'videos' AND NEW.name LIKE 'videos/%' THEN
    IF (NEW.metadata->>'size')::bigint > 524288000 THEN
      RAISE EXCEPTION 'Video file exceeds 500MB limit';
    END IF;
  END IF;
  
  -- Avatars bucket: 5MB limit
  IF NEW.bucket_id = 'avatars' THEN
    IF (NEW.metadata->>'size')::bigint > 5242880 THEN
      RAISE EXCEPTION 'Avatar/banner file exceeds 5MB limit';
    END IF;
  END IF;
  
  -- Subtitles bucket: 1MB limit
  IF NEW.bucket_id = 'subtitles' THEN
    IF (NEW.metadata->>'size')::bigint > 1048576 THEN
      RAISE EXCEPTION 'Subtitle file exceeds 1MB limit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file size validation
DROP TRIGGER IF EXISTS storage_file_size_check ON storage.objects;
CREATE TRIGGER storage_file_size_check
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION check_storage_file_size();

-- ============================================
-- STEP 7: PERFORMANCE INDEXES
-- ============================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_storage_bucket_name 
ON storage.objects(bucket_id, name);

CREATE INDEX IF NOT EXISTS idx_storage_bucket_created 
ON storage.objects(bucket_id, created_at DESC);

-- ============================================
-- STEP 8: MONITORING VIEWS
-- ============================================

-- Create view for storage usage monitoring
CREATE OR REPLACE VIEW storage_usage_by_bucket AS
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  AVG((metadata->>'size')::bigint) as avg_file_size
FROM storage.objects
GROUP BY bucket_id;

-- Create view for user storage quota
CREATE OR REPLACE VIEW user_storage_usage AS
SELECT 
  v.user_id,
  COUNT(DISTINCT so.id) as file_count,
  pg_size_pretty(SUM((so.metadata->>'size')::bigint)) as total_size,
  SUM((so.metadata->>'size')::bigint) as total_size_bytes
FROM videos v
JOIN storage.objects so ON so.name LIKE '%' || v.id || '%'
WHERE so.bucket_id = 'videos'
GROUP BY v.user_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check bucket configurations
-- SELECT * FROM storage.buckets;

-- Check active policies
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check storage usage
-- SELECT * FROM storage_usage_by_bucket;

-- Check user quotas
-- SELECT * FROM user_storage_usage ORDER BY total_size_bytes DESC LIMIT 10;

-- ============================================
-- MAINTENANCE SCHEDULE (Run manually or via cron)
-- ============================================

-- Run cleanup weekly:
-- SELECT cleanup_orphaned_storage_files();

-- Check for large files:
-- SELECT bucket_id, name, (metadata->>'size')::bigint / 1024 / 1024 as size_mb
-- FROM storage.objects
-- WHERE (metadata->>'size')::bigint > 104857600 -- Files > 100MB
-- ORDER BY size_mb DESC;
