-- Quick fix for Storage RLS policies for avatars bucket
-- Run this in Supabase SQL Editor

-- First, remove all existing policies on storage.objects for avatars bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_access" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;

-- Create new simplified policies for avatars bucket
-- 1. Allow public to read/select files
CREATE POLICY "avatars_public_access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. Allow authenticated users to insert files
CREATE POLICY "avatars_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. Allow authenticated users to update files
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. Allow authenticated users to delete files
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verify the bucket exists and is public
-- Run this query to check:
-- SELECT * FROM storage.buckets WHERE name = 'avatars';
-- The 'public' column should be TRUE
