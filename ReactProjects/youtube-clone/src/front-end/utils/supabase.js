import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Supabase configuration
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Image compression helper function
export const compressImage = async (file, maxSizeMB = 1, maxWidthOrHeight = 1920) => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    console.log('File is not an image, skipping compression');
    return file;
  }

  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8
  };
  
  try {
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`🖼️ Original image size: ${originalSizeMB} MB`);
    
    const compressedFile = await imageCompression(file, options);
    
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    
    console.log(`✅ Compressed image size: ${compressedSizeMB} MB`);
    console.log(`📊 Compression ratio: ${compressionRatio}% reduction`);
    
    return compressedFile;
  } catch (error) {
    console.error('❌ Error compressing image:', error);
    return file; // Return original if compression fails
  }
};

// Upload video file to Supabase Storage
export const uploadVideoToSupabase = async (file, videoId) => {
  const filePath = `videos/${videoId}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year - videos are immutable
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
  // Compress image before upload (500px max, 0.5MB max)
  const compressedFile = await compressImage(file, 0.5, 500);
  
  const fileExt = 'jpg'; // Use jpg after compression
  const filePath = `profile-pictures/${userId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, compressedFile, {
      cacheControl: '86400', // 1 day - profile pics change occasionally
      upsert: true, // Overwrite existing profile picture
      contentType: 'image/jpeg'
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
  // Compress image before upload (1920px max width, 1MB max)
  const compressedFile = await compressImage(file, 1, 1920);
  
  const fileExt = 'jpg'; // Use jpg after compression
  const filePath = `banners/${userId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, compressedFile, {
      cacheControl: '86400', // 1 day - banners change occasionally
      upsert: true, // Overwrite existing banner
      contentType: 'image/jpeg'
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
  // Compress thumbnail before upload (1280px max, 0.8MB max)
  const compressedFile = await compressImage(file, 0.8, 1280);
  
  const filePath = `thumbnails/${videoId}.jpg`; // Use consistent jpg naming
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, compressedFile, {
      cacheControl: '2592000', // 30 days - thumbnails rarely change
      upsert: false,
      contentType: 'image/jpeg'
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
// Note: RLS policies will automatically filter based on privacy settings
// Public videos are visible to all, private videos only to their owners
export const getAllVideosFromSupabase = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get only public videos (for public feed/home page)
export const getPublicVideos = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_public', true)
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

// Get all channels (for mentions autocomplete)
export const getAllChannels = async (limit = 50) => {
  const { data, error } = await supabase
    .from('channels')
    .select('id, channel_name, channel_tag, avatar_url, subscriber_count')
    .order('subscriber_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Search channels by name or tag
export const searchChannels = async (query, limit = 20) => {
  if (!query || query.trim().length < 2) {
    return await getAllChannels(limit);
  }

  const searchTerm = `%${query.trim().toLowerCase()}%`;
  
  const { data, error } = await supabase
    .from('channels')
    .select('id, channel_name, channel_tag, avatar_url, subscriber_count')
    .or(`channel_name.ilike.${searchTerm},channel_tag.ilike.${searchTerm}`)
    .order('subscriber_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Get channel by tag (for mention verification)
export const getChannelByTagForMention = async (channelTag) => {
  const { data, error } = await supabase
    .from('channels')
    .select('id, channel_name, channel_tag, user_id')
    .eq('channel_tag', channelTag)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
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

// Get playlists by user ID
export const getPlaylistsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
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

// Check if video is in playlist
export const isVideoInPlaylist = async (playlistId, videoId) => {
  const { data, error } = await supabase
    .from('playlist_videos')
    .select('*')
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Get or create "Watch Later" playlist for user
export const getOrCreateWatchLaterPlaylist = async (userId, channelName = 'Default Channel') => {
  // Try to find existing Watch Later playlist
  const { data: existing, error: searchError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'Watch Later')
    .single();

  if (existing) return existing;

  // Create new Watch Later playlist if it doesn't exist
  if (searchError && searchError.code === 'PGRST116') {
    const watchLaterData = {
      user_id: userId,
      name: 'Watch Later',
      description: 'Videos to watch later',
      is_public: false,
      channel_name: channelName
    };

    const { data: newPlaylist, error: createError } = await supabase
      .from('playlists')
      .insert([watchLaterData])
      .select()
      .single();

    if (createError) throw createError;
    return newPlaylist;
  }

  throw searchError;
};

// Add video to Watch Later
export const addToWatchLater = async (userId, videoId, channelName = 'Default Channel') => {
  const watchLaterPlaylist = await getOrCreateWatchLaterPlaylist(userId, channelName);
  
  // Check if already in Watch Later
  const alreadyAdded = await isVideoInPlaylist(watchLaterPlaylist.id, videoId);
  if (alreadyAdded) {
    return { action: 'already_added', playlist: watchLaterPlaylist };
  }

  await addVideoToPlaylist(watchLaterPlaylist.id, videoId, userId);
  return { action: 'added', playlist: watchLaterPlaylist };
};

// Remove video from Watch Later
export const removeFromWatchLater = async (userId, videoId) => {
  const { data: watchLaterPlaylist, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .eq('name', 'Watch Later')
    .single();

  if (error || !watchLaterPlaylist) return { action: 'not_found' };

  await removeVideoFromPlaylist(watchLaterPlaylist.id, videoId);
  return { action: 'removed', playlist: watchLaterPlaylist };
};

// Check if video is in Watch Later
export const isInWatchLater = async (userId, videoId) => {
  const { data: watchLaterPlaylist, error } = await supabase
    .from('playlists')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Watch Later')
    .single();

  if (error || !watchLaterPlaylist) return false;

  return await isVideoInPlaylist(watchLaterPlaylist.id, videoId);
};

// ========================================
// VIDEO REACTIONS (LIKE/DISLIKE)
// ========================================

// Get user's reaction for a video
export const getUserVideoReaction = async (userId, videoId) => {
  const { data, error } = await supabase
    .from('video_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

// Add or update video reaction (like/dislike)
export const setVideoReaction = async (userId, videoId, reactionType) => {
  // reactionType: 'like' or 'dislike'
  
  // Check if reaction already exists
  const existing = await getUserVideoReaction(userId, videoId);

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // Same reaction - remove it
      const { error } = await supabase
        .from('video_reactions')
        .delete()
        .eq('user_id', userId)
        .eq('video_id', videoId);

      if (error) throw error;
      return { action: 'removed', reactionType };
    } else {
      // Different reaction - update it
      const { data, error } = await supabase
        .from('video_reactions')
        .update({ reaction_type: reactionType, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .select();

      if (error) throw error;
      return { action: 'updated', reactionType, data: data[0] };
    }
  } else {
    // New reaction - insert it
    const { data, error } = await supabase
      .from('video_reactions')
      .insert([{
        user_id: userId,
        video_id: videoId,
        reaction_type: reactionType
      }])
      .select();

    if (error) throw error;
    return { action: 'added', reactionType, data: data[0] };
  }
};

// Get video reaction counts
export const getVideoReactionCounts = async (videoId) => {
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId);

  if (error) throw error;

  const likes = data.filter(r => r.reaction_type === 'like').length;
  const dislikes = data.filter(r => r.reaction_type === 'dislike').length;

  return { likes, dislikes };
};

// Remove video reaction
export const removeVideoReaction = async (userId, videoId) => {
  const { error } = await supabase
    .from('video_reactions')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error) throw error;
};

// ========================================
// CHANNEL SUBSCRIPTIONS
// ========================================

// Check if user is subscribed to a channel
export const isSubscribedToChannel = async (userId, channelId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Subscribe to a channel
export const subscribeToChannel = async (userId, channelId) => {
  // Check if already subscribed
  const alreadySubscribed = await isSubscribedToChannel(userId, channelId);
  
  if (alreadySubscribed) {
    return { action: 'already_subscribed', subscribed: true };
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: userId,
      channel_id: channelId
    }])
    .select();

  if (error) throw error;
  return { action: 'subscribed', subscribed: true, data: data[0] };
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = async (userId, channelId) => {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('channel_id', channelId);

  if (error) throw error;
  return { action: 'unsubscribed', subscribed: false };
};

// Get subscriber count for a channel
export const getSubscriberCount = async (channelId) => {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  if (error) throw error;
  return count || 0;
};

// Get user's subscriptions
export const getUserSubscriptions = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, channels(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get channels subscribed to by user (just channel IDs)
export const getSubscribedChannelIds = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(s => s.channel_id);
};

/************************************
 * SUBTITLE FUNCTIONS
 ************************************/

// Upload subtitle file to Supabase Storage
export const uploadSubtitleToSupabase = async (file, videoId, language) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `subtitles/${videoId}_${language}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('subtitles')
    .upload(filePath, file, {
      cacheControl: '604800', // 7 days - subtitles may be updated
      upsert: true // Allow updating existing subtitles
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('subtitles')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Save subtitle metadata to database
export const saveSubtitleMetadata = async (subtitleData) => {
  const { data, error } = await supabase
    .from('subtitles')
    .insert([subtitleData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get subtitles for a video
export const getSubtitlesForVideo = async (videoId) => {
  const { data, error } = await supabase
    .from('subtitles')
    .select('*')
    .eq('video_id', videoId)
    .order('is_default', { ascending: false })
    .order('language', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================
// ANALYTICS & DEMOGRAPHICS FUNCTIONS
// ============================================

// Track video view with demographic data
export const trackVideoView = async (videoId, demographicData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const viewData = {
      video_id: videoId,
      user_id: user?.id || null,
      device: demographicData.device,
      browser: demographicData.browser,
      os: demographicData.os,
      resolution: demographicData.resolution,
      timezone: demographicData.timezone,
      locale: demographicData.locale,
      region: demographicData.region,
      time_of_day: demographicData.timeOfDay,
      day_of_week: demographicData.dayOfWeek,
      screen_width: demographicData.screenWidth,
      screen_height: demographicData.screenHeight,
      viewport_width: demographicData.viewportWidth,
      viewport_height: demographicData.viewportHeight,
      viewed_at: demographicData.timestamp
    };

    const { data, error } = await supabase
      .from('video_views')
      .insert([viewData])
      .select();

    if (error) {
      console.error('Error tracking view:', error);
      return null;
    }

    return data?.[0];
  } catch (err) {
    console.error('Error in trackVideoView:', err);
    return null;
  }
};

// Get video analytics with demographic data
export const getVideoAnalytics = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from('video_views')
      .select('*')
      .eq('video_id', videoId)
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching video analytics:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getVideoAnalytics:', err);
    return [];
  }
};

// Get channel analytics (all videos)
export const getChannelAnalytics = async (channelIdOrUserId) => {
  try {
    // First get all videos for this channel/user
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', channelIdOrUserId);

    if (videosError || !videos || videos.length === 0) {
      return [];
    }

    const videoIds = videos.map(v => v.id);

    // Get all views for these videos
    const { data, error } = await supabase
      .from('video_views')
      .select('*')
      .in('video_id', videoIds)
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching channel analytics:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getChannelAnalytics:', err);
    return [];
  }
};

// Get analytics for specific time range
export const getAnalyticsByTimeRange = async (videoId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('video_views')
      .select('*')
      .eq('video_id', videoId)
      .gte('viewed_at', startDate.toISOString())
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics by time range:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAnalyticsByTimeRange:', err);
    return [];
  }
};

// Update subtitle
export const updateSubtitle = async (subtitleId, updates) => {
  const { data, error } = await supabase
    .from('subtitles')
    .update(updates)
    .eq('id', subtitleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete subtitle
export const deleteSubtitle = async (subtitleId) => {
  const { error } = await supabase
    .from('subtitles')
    .delete()
    .eq('id', subtitleId);

  if (error) throw error;
  return { success: true };
};

// Set default subtitle for a video
export const setDefaultSubtitle = async (videoId, subtitleId) => {
  // First, unset all defaults for this video
  await supabase
    .from('subtitles')
    .update({ is_default: false })
    .eq('video_id', videoId);

  // Then set the new default
  const { data, error } = await supabase
    .from('subtitles')
    .update({ is_default: true })
    .eq('id', subtitleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// FLAGGING FUNCTIONS

// Flag a comment
export const flagComment = async (commentId, videoId, flaggedByUserId, flaggedByUsername, reason) => {
  const { data, error } = await supabase
    .from('flagged_comments')
    .insert({
      comment_id: commentId,
      video_id: videoId,
      flagged_by_user_id: flaggedByUserId,
      flagged_by_username: flaggedByUsername,
      reason: reason
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Flag a video
export const flagVideo = async (videoId, videoTitle, channelId, flaggedByUserId, flaggedByUsername, reason) => {
  const { data, error } = await supabase
    .from('flagged_videos')
    .insert({
      video_id: videoId,
      video_title: videoTitle,
      channel_id: channelId,
      flagged_by_user_id: flaggedByUserId,
      flagged_by_username: flaggedByUsername,
      reason: reason
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get flagged comments for a channel (all videos)
export const getFlaggedCommentsForChannel = async (channelId) => {
  const { data, error } = await supabase
    .from('flagged_comments')
    .select(`
      *,
      comments (
        comment_text,
        user_name,
        created_at
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Filter by channel - need to get videos for this channel first
  const { data: videos } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channelId);
  
  const videoIds = videos?.map(v => v.id) || [];
  const filteredData = data?.filter(flag => videoIds.includes(flag.video_id)) || [];
  
  return filteredData;
};

// Get flagged videos for a channel
export const getFlaggedVideosForChannel = async (channelId) => {
  const { data, error } = await supabase
    .from('flagged_videos')
    .select('*')
    .eq('channel_id', channelId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update flag status (comment)
export const updateCommentFlagStatus = async (flagId, status, reviewedBy) => {
  const { data, error } = await supabase
    .from('flagged_comments')
    .update({
      status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update flag status (video)
export const updateVideoFlagStatus = async (flagId, status, reviewedBy) => {
  const { data, error } = await supabase
    .from('flagged_videos')
    .update({
      status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all channel stats for dashboard
export const getChannelDashboardStats = async (channelId) => {
  // Get total videos
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, views, likes, dislikes, created_at')
    .eq('channel_id', channelId);

  if (videosError) throw videosError;

  // Get total comments across all videos
  const videoIds = videos?.map(v => v.id) || [];
  const { count: totalComments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .in('video_id', videoIds);

  // Get flagged items counts
  const { count: flaggedCommentsCount } = await supabase
    .from('flagged_comments')
    .select('*', { count: 'exact', head: true })
    .in('video_id', videoIds)
    .eq('status', 'pending');

  const { count: flaggedVideosCount } = await supabase
    .from('flagged_videos')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId)
    .eq('status', 'pending');

  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;

  return {
    totalVideos: videos?.length || 0,
    totalViews,
    totalLikes,
    totalComments: totalComments || 0,
    flaggedComments: flaggedCommentsCount || 0,
    flaggedVideos: flaggedVideosCount || 0,
    recentVideos: videos?.filter(v => {
      const createdDate = new Date(v.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length || 0
  };
};

// ============================================
// RBAC (ROLE-BASED ACCESS CONTROL) FUNCTIONS
// ============================================

// Get current user's role
export const getUserRole = async (userId) => {
  const { data, error } = await supabase
    .rpc('get_user_role', { p_user_id: userId });
  
  if (error) {
    console.error('Error getting user role:', error);
    return 'viewer'; // Default to viewer if error
  }
  return data || 'viewer';
};

// Check if user has specific permission
export const userHasPermission = async (userId, permission) => {
  const { data, error } = await supabase
    .rpc('user_has_permission', {
      p_user_id: userId,
      p_permission: permission
    });
  
  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }
  return data === true;
};

// Grant role to user (admin only)
export const grantUserRole = async (userId, role, grantedBy, expiresAt = null) => {
  const { data, error } = await supabase
    .rpc('grant_user_role', {
      p_user_id: userId,
      p_role: role,
      p_granted_by: grantedBy,
      p_expires_at: expiresAt
    });
  
  if (error) throw error;
  return data;
};

// Revoke user role (admin only)
export const revokeUserRole = async (userId) => {
  const { data, error } = await supabase
    .rpc('revoke_user_role', { p_user_id: userId });
  
  if (error) throw error;
  return data;
};

// Log admin action
export const logAdminAction = async (adminUserId, action, targetType = null, targetId = null, details = {}) => {
  const { data, error } = await supabase
    .rpc('log_admin_action', {
      p_admin_user_id: adminUserId,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details
    });
  
  if (error) throw error;
  return data;
};

// Get all users with their roles (admin only)
export const getAllUsersWithRoles = async () => {
  // Get all users from auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;

  // Get all user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('is_active', true);
  
  if (rolesError) throw rolesError;

  // Merge data
  const usersWithRoles = authUsers.users.map(user => {
    const roleData = userRoles.find(r => r.user_id === user.id);
    return {
      ...user,
      role: roleData?.role || 'viewer',
      granted_at: roleData?.granted_at,
      granted_by: roleData?.granted_by,
      expires_at: roleData?.expires_at
    };
  });

  return usersWithRoles;
};

// Get user by ID with role (admin only)
export const getUserWithRole = async (userId) => {
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) throw userError;

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (roleError && roleError.code !== 'PGRST116') throw roleError;

  return {
    ...user,
    role: roleData?.role || 'viewer',
    granted_at: roleData?.granted_at,
    granted_by: roleData?.granted_by,
    expires_at: roleData?.expires_at
  };
};

// Get admin audit log
export const getAdminAuditLog = async (limit = 100) => {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

// Get role statistics
export const getRoleStatistics = async () => {
  const { data, error } = await supabase
    .from('role_statistics')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Get all permissions for a role
export const getRolePermissions = async (role) => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', role);
  
  if (error) throw error;
  return data;
};

// Admin: Delete any video
export const adminDeleteVideo = async (adminUserId, videoId) => {
  // Log the action first
  await logAdminAction(adminUserId, 'delete_video', 'video', videoId);
  
  // Get video details for cleanup
  const video = await getVideoFromSupabase(videoId);
  
  // Delete the video
  await deleteVideoFromSupabase(videoId, video.video_url, video.thumbnail_url);
  
  return true;
};

// Admin: Suspend user
export const adminSuspendUser = async (adminUserId, targetUserId, reason) => {
  await logAdminAction(adminUserId, 'suspend_user', 'user', targetUserId, { reason });
  
  // Update user metadata to mark as suspended
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_by: adminUserId,
      suspension_reason: reason
    }
  });
  
  if (error) throw error;
  return true;
};

// Admin: Unsuspend user
export const adminUnsuspendUser = async (adminUserId, targetUserId) => {
  await logAdminAction(adminUserId, 'unsuspend_user', 'user', targetUserId);
  
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      suspended: false,
      unsuspended_at: new Date().toISOString(),
      unsuspended_by: adminUserId
    }
  });
  
  if (error) throw error;
  return true;
};

// Check if current user is admin
export const isCurrentUserAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const role = await getUserRole(user.id);
  return role === 'admin';
};

// Check if current user is moderator or admin
export const isCurrentUserModerator = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const role = await getUserRole(user.id);
  return role === 'admin' || role === 'moderator';
};
