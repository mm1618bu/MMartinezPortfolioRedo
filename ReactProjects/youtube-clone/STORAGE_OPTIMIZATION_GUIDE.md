# Storage Optimization Guide

## Overview
This guide provides comprehensive storage bucket optimizations for better security, performance, and cost efficiency in your YouTube clone application.

## 🎯 Key Improvements

### 1. **Security Enhancements**
- ✅ **Authenticated-only uploads**: Only logged-in users can upload content
- ✅ **User-specific paths**: Profile pictures/banners must match user ID
- ✅ **Ownership verification**: Users can only modify their own content
- ✅ **MIME type restrictions**: Only allowed file types can be uploaded
- ✅ **File size limits**: Enforced at both bucket and trigger levels

### 2. **Performance Optimizations**
- ✅ **CDN-friendly caching**: Files served with appropriate cache headers
- ✅ **Database indexes**: Fast lookups by bucket and creation date
- ✅ **Optimized queries**: Efficient ownership checks using EXISTS
- ✅ **Public read access**: Videos/images served directly without auth checks
- ✅ **Monitoring views**: Real-time storage usage insights

### 3. **Cost Savings**
- ✅ **File size limits**: Prevents excessive storage costs
  - Videos: 500MB max
  - Avatars/Banners: 5MB max
  - Subtitles: 1MB max
- ✅ **Orphaned file cleanup**: Automatic removal of unused files
- ✅ **Storage quotas**: Track per-user usage
- ✅ **Compression**: Images pre-compressed on upload (client-side)

## 📊 Bucket Configuration

| Bucket | Purpose | Max Size | Public | MIME Types |
|--------|---------|----------|--------|------------|
| `videos` | Video files & thumbnails | 500MB | Yes (read) | mp4, webm, ogg, mov, jpeg, png, webp |
| `avatars` | Profile pics & banners | 5MB | Yes (read) | jpeg, png, webp, gif |
| `subtitles` | VTT subtitle files | 1MB | Yes (read) | vtt, txt |

## 🚀 Implementation Steps

### Step 1: Run the SQL Migration

```bash
# Connect to your Supabase project
psql -h your-host -U postgres -d postgres -f optimized_storage_policies.sql
```

Or use the Supabase SQL Editor:
1. Open your Supabase project
2. Go to SQL Editor
3. Paste the contents of `optimized_storage_policies.sql`
4. Click "Run"

### Step 2: Verify Bucket Configuration

```sql
-- Check that buckets are configured correctly
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets;
```

Expected output:
- `videos`: public=true, limit=524288000 (500MB)
- `avatars`: public=true, limit=5242880 (5MB)
- `subtitles`: public=true, limit=1048576 (1MB)

### Step 3: Verify Policies

```sql
-- Check active storage policies
SELECT 
  policyname, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;
```

You should see 12 policies (4 per bucket: read, insert, update, delete).

### Step 4: Test Upload Functionality

Test that your application can:
- ✅ Upload videos (authenticated users only)
- ✅ Upload thumbnails (authenticated users only)
- ✅ Upload profile pictures (own user ID only)
- ✅ Read all public files (anyone)
- ❌ Upload files exceeding size limits (should fail)
- ❌ Modify other users' files (should fail)

## 🔐 Security Model

### Videos Bucket
```
├── videos/
│   └── {videoId}_{filename}.mp4    [Owner: video creator]
└── thumbnails/
    └── {videoId}.jpg                [Owner: video creator]
```

**Permissions:**
- **Public**: Read/download
- **Authenticated**: Upload new files
- **Owner only**: Update/delete existing files

### Avatars Bucket
```
├── profile-pictures/
│   └── {userId}.jpg                [Owner: specific user]
└── banners/
    └── {userId}.jpg                [Owner: specific user]
```

**Permissions:**
- **Public**: Read/download
- **Authenticated**: Upload to own userId path only
- **Owner only**: Update/delete own files

### Subtitles Bucket
```
└── subtitles/
    └── {videoId}_{language}.vtt    [Owner: video creator]
```

**Permissions:**
- **Public**: Read/download
- **Authenticated**: Upload for own videos
- **Owner only**: Update/delete own subtitles

## 📈 Monitoring & Maintenance

### Check Storage Usage

```sql
-- Overall usage by bucket
SELECT * FROM storage_usage_by_bucket;

-- Top 10 users by storage usage
SELECT * FROM user_storage_usage 
ORDER BY total_size_bytes DESC 
LIMIT 10;

-- Find large files (>100MB)
SELECT 
  bucket_id, 
  name, 
  (metadata->>'size')::bigint / 1024 / 1024 as size_mb,
  created_at
FROM storage.objects
WHERE (metadata->>'size')::bigint > 104857600
ORDER BY size_mb DESC;
```

### Clean Up Orphaned Files

Run this weekly to remove files without database records:

```sql
SELECT cleanup_orphaned_storage_files();
```

Or set up a cron job:

```sql
-- Create pg_cron extension (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly cleanup (Sundays at 3 AM)
SELECT cron.schedule(
  'weekly-storage-cleanup',
  '0 3 * * 0',
  'SELECT cleanup_orphaned_storage_files();'
);
```

## 🎨 Frontend Optimizations

### Image Compression (Already Implemented)

The application uses `browser-image-compression` to compress images before upload:

```javascript
// Profile pictures: 500px max, 0.5MB max
const compressedFile = await compressImage(file, 0.5, 500);

// Banners: 1920px max, 1MB max
const compressedFile = await compressImage(file, 1, 1920);

// Thumbnails: 1280px max, 0.8MB max
const compressedFile = await compressImage(file, 0.8, 1280);
```

### Cache Control Headers

All uploads include cache control:

```javascript
{
  cacheControl: '3600', // 1 hour cache
  upsert: true/false,
  contentType: 'image/jpeg'
}
```

**Recommendation**: Increase cache time for static assets:

```javascript
// For videos (rarely change)
cacheControl: '31536000', // 1 year

// For avatars (may change)
cacheControl: '86400', // 1 day

// For thumbnails (rarely change)
cacheControl: '2592000', // 30 days
```

## ⚡ Performance Best Practices

### 1. Use CDN
Configure Supabase Storage CDN for faster global delivery:
- Files automatically served via Supabase CDN
- Consider CloudFlare for additional layer

### 2. Optimize Video Encoding
Consider implementing:
- Multiple quality levels (360p, 720p, 1080p)
- Adaptive bitrate streaming (HLS/DASH)
- Video transcoding queue (already in database)

### 3. Lazy Loading
Implement progressive loading:
- Low-quality placeholder → Full quality
- Intersection Observer for viewport loading
- Thumbnail sprites for scrubbing

### 4. Compression
Continue using image compression:
- WebP format for better compression
- Responsive images with srcset
- Video compression with FFmpeg

## 💰 Cost Optimization Strategies

### 1. Storage Tiers
- Hot storage: Recent uploads (last 30 days)
- Warm storage: Older content (30-90 days)
- Cold storage: Archive (90+ days, rarely accessed)

### 2. Lifecycle Policies
```sql
-- Move old thumbnails to cold storage after 90 days
-- (Implement at Supabase project level)
```

### 3. Deduplication
Prevent duplicate uploads:
```javascript
// Check if file already exists before upload
const { data } = await supabase.storage
  .from('videos')
  .list('videos/', {
    search: videoId
  });
```

### 4. Usage Quotas
Implement per-user limits:
```sql
-- Add to application logic
CREATE TABLE user_storage_quotas (
  user_id UUID PRIMARY KEY,
  max_storage_bytes BIGINT DEFAULT 10737418240, -- 10GB
  used_storage_bytes BIGINT DEFAULT 0,
  max_videos INTEGER DEFAULT 100
);
```

## 🔧 Troubleshooting

### Issue: Upload fails with "Policy violation"

**Solution**: Check user authentication and file path:
```javascript
// Profile pictures must match user ID
const filePath = `profile-pictures/${userId}.jpg`;

// Videos must be in videos/ folder
const filePath = `videos/${videoId}_${filename}`;
```

### Issue: "File size exceeds limit"

**Solution**: 
1. Check bucket configuration: `SELECT file_size_limit FROM storage.buckets WHERE id = 'videos';`
2. Verify trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'storage_file_size_check';`
3. Compress files before upload (see Frontend Optimizations)

### Issue: Slow uploads

**Solution**:
1. Enable resumable uploads (for large files)
2. Use multipart upload for files >100MB
3. Implement upload progress indicator
4. Consider client-side compression

### Issue: High storage costs

**Solution**:
1. Run orphaned file cleanup: `SELECT cleanup_orphaned_storage_files();`
2. Check for large files: See "Find large files" query above
3. Implement user quotas
4. Archive old content to cheaper storage

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Security Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
- [Video Compression Best Practices](https://developers.google.com/media/vp9)

## ✅ Migration Checklist

- [ ] Backup current storage policies
- [ ] Run `optimized_storage_policies.sql`
- [ ] Verify bucket configurations
- [ ] Test upload functionality
- [ ] Test download/read access
- [ ] Verify file size limits work
- [ ] Test ownership permissions
- [ ] Set up monitoring queries
- [ ] Schedule cleanup job
- [ ] Update cache control headers (optional)
- [ ] Implement usage quotas (optional)
- [ ] Configure CDN settings (optional)

## 🚨 Rollback Plan

If issues occur, restore previous policies:

```sql
-- Re-enable public access (old setup)
DROP POLICY IF EXISTS "videos_public_read" ON storage.objects;
CREATE POLICY "Allow public reads from videos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Similar for other buckets...
```

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs → Storage
2. Verify RLS policies are enabled
3. Check user authentication tokens
4. Review database triggers are active
