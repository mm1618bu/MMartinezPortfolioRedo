import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload video file to Supabase Storage
export const uploadVideoToSupabase = async (file, videoId) => {
  const filePath = `videos/${videoId}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Upload thumbnail to Supabase Storage
export const uploadThumbnailToSupabase = async (file, videoId) => {
  const filePath = `thumbnails/${videoId}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Save video metadata to Supabase database
export const saveVideoMetadata = async (videoData) => {
  const { data, error } = await supabase
    .from('videos')
    .insert([videoData])
    .select();

  if (error) throw error;
  return data[0];
};

// Get all videos from Supabase database
export const getAllVideosFromSupabase = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get single video by ID
export const getVideoFromSupabase = async (videoId) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error) throw error;
  return data;
};

// Update video (e.g., views, likes, dislikes)
export const updateVideoInSupabase = async (videoId, updates) => {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete video
export const deleteVideoFromSupabase = async (videoId, videoUrl, thumbnailUrl) => {
  // Delete files from storage
  if (videoUrl) {
    const videoPath = videoUrl.split('/videos/')[1];
    await supabase.storage.from('videos').remove([`videos/${videoPath}`]);
  }
  
  if (thumbnailUrl) {
    const thumbnailPath = thumbnailUrl.split('/videos/')[1];
    await supabase.storage.from('videos').remove([`thumbnails/${thumbnailPath}`]);
  }

  // Delete metadata from database
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) throw error;
};
