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

// Upload profile picture to Supabase Storage
export const uploadProfilePicture = async (file, userId) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `profile-pictures/${userId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Overwrite existing profile picture
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Upload banner image to Supabase Storage
export const uploadBannerImage = async (file, userId) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `banners/${userId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Overwrite existing banner
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Update user metadata (profile picture URL)
export const updateUserMetadata = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });

  if (error) throw error;
  return data;
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

// ============================================
// COMMENTS FUNCTIONS
// ============================================

// Get all comments for a video
export const getCommentsForVideo = async (videoId) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Add a new comment
export const addComment = async (videoId, userName, commentText) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([{
      video_id: videoId,
      user_name: userName,
      comment_text: commentText
    }])
    .select();

  if (error) throw error;
  return data[0];
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

// Update a comment
export const updateComment = async (commentId, commentText) => {
  const { data, error } = await supabase
    .from('comments')
    .update({ comment_text: commentText, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select();

  if (error) throw error;
  return data[0];
};

// Like a comment
export const likeComment = async (commentId) => {
  // First get current likes
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('likes')
    .eq('id', commentId)
    .single();

  if (fetchError) throw fetchError;

  // Increment likes
  const { data, error } = await supabase
    .from('comments')
    .update({ likes: (comment.likes || 0) + 1 })
    .eq('id', commentId)
    .select();

  if (error) throw error;
  return data[0];
};

// ============================================
// REPLY FUNCTIONS
// ============================================

// Get replies for a comment
export const getRepliesForComment = async (commentId) => {
  const { data, error } = await supabase
    .from('comment_replies')
    .select('*')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Add a reply to a comment
export const addReply = async (commentId, videoId, userName, replyText) => {
  const { data, error } = await supabase
    .from('comment_replies')
    .insert([{
      comment_id: commentId,
      video_id: videoId,
      user_name: userName,
      reply_text: replyText,
      likes: 0
    }])
    .select();

  if (error) throw error;
  return data[0];
};

// Delete a reply
export const deleteReply = async (replyId) => {
  const { error } = await supabase
    .from('comment_replies')
    .delete()
    .eq('id', replyId);

  if (error) throw error;
};

// Update a reply
export const updateReply = async (replyId, replyText) => {
  const { data, error } = await supabase
    .from('comment_replies')
    .update({ reply_text: replyText, updated_at: new Date().toISOString() })
    .eq('id', replyId)
    .select();

  if (error) throw error;
  return data[0];
};

// Like a reply
export const likeReply = async (replyId) => {
  // First get current likes
  const { data: reply, error: fetchError } = await supabase
    .from('comment_replies')
    .select('likes')
    .eq('id', replyId)
    .single();

  if (fetchError) throw fetchError;

  // Increment likes
  const { data, error } = await supabase
    .from('comment_replies')
    .update({ likes: (reply.likes || 0) + 1 })
    .eq('id', replyId)
    .select();

  if (error) throw error;
  return data[0];
};

// ============================================
// CHANNEL FUNCTIONS
// ============================================

// Create a new channel
export const createChannel = async (channelData) => {
  const { data, error } = await supabase
    .from('channels')
    .insert([{
      channel_name: channelData.channel_name,
      channel_tag: channelData.channel_tag,
      channel_description: channelData.channel_description,
      user_id: channelData.user_id
    }])
    .select();

  if (error) throw error;
  return data[0];
};

// Get channel by user ID
export const getChannelByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No channel found
    throw error;
  }
  return data;
};

// Get channel by channel tag (handle)
export const getChannelByTag = async (channelTag) => {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('channel_tag', channelTag)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No channel found
    throw error;
  }
  return data;
};

// Update channel
export const updateChannel = async (channelId, updates) => {
  const { data, error } = await supabase
    .from('channels')
    .update(updates)
    .eq('channel_id', channelId)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete channel
export const deleteChannel = async (channelId) => {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('channel_id', channelId);

  if (error) throw error;
};

// Check if channel tag is available
export const isChannelTagAvailable = async (channelTag) => {
  const { data, error } = await supabase
    .from('channels')
    .select('channel_id')
    .eq('channel_tag', channelTag)
    .single();

  if (error && error.code === 'PGRST116') return true; // Tag available
  if (error) throw error;
  return false; // Tag taken
};

// Get current user's channel
export const getCurrentUserChannel = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  return await getChannelByUserId(user.id);
};

// ============================================
// PLAYLIST FUNCTIONS
// ============================================

// Create a new playlist
export const createPlaylist = async (playlistData) => {
  const { data, error } = await supabase
    .from('playlists')
    .insert([playlistData])
    .select();

  if (error) throw error;
  return data[0];
};

// Get all playlists
export const getAllPlaylists = async () => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get playlists by channel
export const getPlaylistsByChannel = async (channelName) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('channel_name', channelName)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get single playlist by ID
export const getPlaylistById = async (playlistId) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single();

  if (error) throw error;
  return data;
};

// Update playlist
export const updatePlaylist = async (playlistId, updates) => {
  const { data, error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select();

  if (error) throw error;
  return data[0];
};

// Delete playlist
export const deletePlaylist = async (playlistId) => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw error;
};

// Get videos in a playlist
export const getPlaylistVideos = async (playlistId) => {
  const { data, error } = await supabase
    .from('playlist_videos')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) throw error;
  
  // Get actual video data
  const videoIds = data.map(pv => pv.video_id);
  if (videoIds.length === 0) return [];
  
  const { data: videos, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds);
  
  if (videoError) throw videoError;
  
  // Merge playlist_videos data with video data
  return data.map(pv => ({
    ...pv,
    video: videos.find(v => v.id === pv.video_id)
  }));
};

// Add video to playlist
export const addVideoToPlaylist = async (playlistId, videoId, addedBy = null) => {
  // Get next position
  const { data: existingVideos, error: countError } = await supabase
    .from('playlist_videos')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextPosition = existingVideos.length > 0 ? existingVideos[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('playlist_videos')
    .insert([{
      playlist_id: playlistId,
      video_id: videoId,
      position: nextPosition,
      added_by: addedBy
    }])
    .select();

  if (error) throw error;
  return data[0];
};

// Remove video from playlist
export const removeVideoFromPlaylist = async (playlistId, videoId) => {
  const { error } = await supabase
    .from('playlist_videos')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId);

  if (error) throw error;
};
