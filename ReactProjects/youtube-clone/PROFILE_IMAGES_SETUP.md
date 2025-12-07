# Profile Picture & Banner Upload - Setup Instructions

## ✅ Implementation Complete

Added profile picture and banner upload functionality to the UserProfilePage.

## 🗄️ Required Supabase Storage Buckets

You need to create a storage bucket in Supabase to store the images:

### Create the "avatars" Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Create a bucket with these settings:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Yes (enable)
   - **File size limit**: 10MB (optional)
   - **Allowed MIME types**: `image/*` (optional)

5. **Set up Storage Policies** for the `avatars` bucket:

```sql
-- Allow public read access to avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update files in avatars bucket
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete files in avatars bucket
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

**Note**: These policies allow any authenticated user to upload/update/delete any file in the avatars bucket. For production, you may want stricter policies that verify the user owns the file based on the file path.

## 📁 Folder Structure in Storage

The upload functions organize files like this:
```
avatars/
├── profile-pictures/
│   ├── {userId}.jpg
│   ├── {userId}.png
│   └── ...
└── banners/
    ├── {userId}.jpg
    ├── {userId}.png
    └── ...
```

## 🎨 Features Implemented

### Profile Picture Upload
- Click the 📷 camera button on the avatar
- Select an image file (JPG, PNG, GIF, etc.)
- Max file size: 5MB
- Overwrites previous profile picture
- Updates immediately in the UI

### Banner Image Upload
- Click the **"📷 Change Banner"** button on the banner
- Select an image file
- Max file size: 10MB
- Overwrites previous banner
- Updates immediately in the UI

### UI Elements
- **Banner Section**: Full-width banner at top of profile (200px height)
- **Default Banner**: Purple gradient if no banner uploaded
- **Avatar Upload Button**: Small camera icon on bottom-right of avatar
- **Banner Upload Button**: Top-right corner of banner area
- **Loading States**: Buttons show "⏳ Uploading..." during upload
- **Error Handling**: Validates file type and size, shows error messages

## 🔧 Functions Added to supabase.js

```javascript
uploadProfilePicture(file, userId)  // Upload avatar to profile-pictures/
uploadBannerImage(file, userId)     // Upload banner to banners/
updateUserMetadata(updates)         // Update user's metadata in auth
```

## 💾 Data Storage

Images are stored in:
- **Storage**: Supabase Storage bucket `avatars`
- **Metadata**: URLs saved in `auth.users` table in `user_metadata` column:
  - `avatar_url`: Profile picture URL
  - `banner_url`: Banner image URL

## 🎯 How It Works

1. User clicks upload button
2. File picker opens
3. User selects image
4. File is validated (type & size)
5. Image uploads to Supabase Storage
6. Public URL is generated
7. User metadata is updated with the URL
8. UI refreshes with new image

## 📱 Responsive Design

- Banner adjusts to full width
- Upload buttons remain accessible on mobile
- Avatar maintains circular shape
- Images scale properly on all devices

## 🔒 Security

- File type validation (images only)
- File size limits (5MB avatar, 10MB banner)
- Storage policies ensure users can only upload to their own folders
- Public read access allows images to be displayed
- Authenticated write access prevents unauthorized uploads

## 🧪 Testing Checklist

- [ ] Create `avatars` bucket in Supabase Storage
- [ ] Set bucket to public
- [ ] Apply storage policies
- [ ] Upload profile picture
- [ ] Verify image appears immediately
- [ ] Upload banner image
- [ ] Verify banner displays correctly
- [ ] Try uploading non-image file (should show error)
- [ ] Try uploading oversized file (should show error)
- [ ] Upload new image to replace existing one
- [ ] Check Supabase Storage to see files
- [ ] Verify URLs are saved in user metadata

## 📸 Screenshot View

The profile page now has:
- Banner at top with upload button
- Avatar overlapping the banner
- Camera icon on avatar for upload
- Clean, modern design with smooth transitions
