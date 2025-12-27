# Supabase Setup Guide for YouTube Clone

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and create

## Step 2: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name it: `videos`
4. Make it **public** (so videos can be accessed via URL)
5. Click "Create bucket"

## Step 3: Create Database Table

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL query:

```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON videos
  FOR SELECT
  TO public
  USING (true);

-- Create policies for public insert (you may want to restrict this later)
CREATE POLICY "Allow public insert access" ON videos
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for public update (you may want to restrict this later)
CREATE POLICY "Allow public update access" ON videos
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
```

## Step 4: Get Your Credentials

1. Go to **Settings** > **API**
2. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 5: Configure Your App

1. Create a `.env` file in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

## Step 6: Storage Policies (Optional but Recommended)

To allow public uploads to storage, run this in SQL Editor:

```sql
-- Allow public uploads to videos bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'videos');

-- Allow public reads from videos bucket
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

## Features Now Available:

✅ Video files stored in Supabase Storage (with public URLs)
✅ Thumbnails stored in Supabase Storage
✅ Video metadata stored in Supabase Database
✅ Automatic view counting
✅ Persistent likes/dislikes
✅ Videos accessible from any device
✅ No local storage limitations

## Testing:

1. Upload a video through your app
2. Check Supabase Storage to see the uploaded files
3. Check the `videos` table to see the metadata
4. Videos should persist across browser sessions and devices!

## Notes:

- Make sure to add `.env` to your `.gitignore` to keep credentials secret
- For production, consider adding authentication and user-specific policies
- Storage bucket size limits depend on your Supabase plan
