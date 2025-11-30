-- Fix Storage Bucket Policies for video uploads

-- First, check if policies exist and drop them
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create policy to allow anyone to upload to the 'videos' bucket
CREATE POLICY "Allow public uploads to videos bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

-- Create policy to allow anyone to read from the 'videos' bucket
CREATE POLICY "Allow public reads from videos bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Create policy to allow anyone to delete from the 'videos' bucket
CREATE POLICY "Allow public deletes from videos bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'videos');

-- Create policy to allow anyone to update files in the 'videos' bucket
CREATE POLICY "Allow public updates to videos bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');
