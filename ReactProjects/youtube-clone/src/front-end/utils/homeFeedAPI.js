/**
 * Home Feed API
 * Provides personalized video recommendations and feed management
 */

import { supabase } from './supabase';

/**
 * Available video categories
 */
export const VIDEO_CATEGORIES = [
  'Entertainment',
  'Education',
  'Music',
  'Gaming',
  'News',
  'Sports',
  'Technology',
  'Science',
  'Comedy',
  'Vlogs',
  'How-to',
  'Reviews',
  'Tutorial',
  'Documentary',
  'Animation',
  'Cooking',
  'Travel',
  'Fitness',
  'Beauty',
  'Fashion',
  'Art',
  'Automotive',
  'Pets',
  'Kids',
  'Other'
];

/**
 * Get personalized home feed for user
 * @param {string} userId - User ID (null for anonymous)
 * @param {number} limit - Number of videos to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of recommended videos
 */
export const getHomeFeed = async (userId = null, limit = 20, offset = 0) => {
  try {
    if (userId) {
      // Personalized feed for logged-in users
      return await getPersonalizedFeed(userId, limit, offset);
    } else {
      // Generic trending feed for anonymous users
      return await getTrendingFeed(limit, offset);
    }
  } catch (error) {
    console.error('Error fetching home feed:', error);
    // Fallback to basic feed
    return await getBasicFeed(limit, offset);
  }
};

/**
 * Get personalized feed based on user preferences and history
 */
const getPersonalizedFeed = async (userId, limit, offset) => {
  try {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's watch history for recommendations
    const { data: watchHistory } = await supabase
      .from('watch_history')
      .select('video_id, watch_time, completed')
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(50);

    const watchedVideoIds = watchHistory?.map(w => w.video_id) || [];
    const blockedChannels = preferences?.blocked_channels || [];

    // Build query for personalized recommendations
    let query = supabase
      .from('videos')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        duration,
        views,
        likes,
        dislikes,
        channel_name,
        created_at,
        quality,
        is_public
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Exclude watched videos
    if (watchedVideoIds.length > 0) {
      query = query.not('id', 'in', `(${watchedVideoIds.join(',')})`);
    }

    // Exclude blocked channels
    if (blockedChannels.length > 0) {
      query = query.not('channel_name', 'in', `(${blockedChannels.join(',')})`);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Score and sort videos based on user preferences
    const scoredVideos = data.map(video => {
      let score = 0;

      // Base score from engagement
      score += (video.views || 0) * 0.1;
      score += (video.likes || 0) * 5;
      score -= (video.dislikes || 0) * 2;

      // Boost recent videos
      const daysOld = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 100 - daysOld * 2);

      // Boost preferred categories
      if (preferences?.preferred_categories && video.video_categories) {
        const videoCategories = video.video_categories.map(vc => vc.category);
        const matchingCategories = videoCategories.filter(cat => 
          preferences.preferred_categories.includes(cat)
        );
        score += matchingCategories.length * 50;
      }

      return { ...video, recommendation_score: score };
    });

    // Sort by score and return
    return scoredVideos.sort((a, b) => b.recommendation_score - a.recommendation_score);
  } catch (error) {
    console.error('Error in personalized feed:', error);
    return await getTrendingFeed(limit, offset);
  }
};

/**
 * Get trending videos feed
 */
const getTrendingFeed = async (limit, offset) => {
  try {
    // Try to use materialized view first
    const { data: trending, error: trendingError } = await supabase
      .from('trending_videos')
      .select('*')
      .range(offset, offset + limit - 1);

    if (!trendingError && trending && trending.length > 0) {
      return trending;
    }

    // Fallback to regular query
    return await getBasicFeed(limit, offset);
  } catch (error) {
    console.error('Error fetching trending feed:', error);
    return await getBasicFeed(limit, offset);
  }
};

/**
 * Get basic feed (fallback)
 */
const getBasicFeed = async (limit, offset) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_public', true)
      .order('views', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching basic feed:', error);
    return [];
  }
};

/**
 * Get videos by category
 */
export const getVideosByCategory = async (category, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select(`
        video_id,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          views,
          likes,
          channel_name,
          created_at,
          quality
        )
      `)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data?.map(item => item.videos).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return [];
  }
};

/**
 * Get recommended videos based on current video
 */
export const getRelatedVideos = async (videoId, limit = 10) => {
  try {
    // Get current video's categories and tags
    const { data: video } = await supabase
      .from('videos')
      .select(`
        id,
        channel_name,
        keywords,
        meta_tags
      `)
      .eq('id', videoId)
      .single();

    if (!video) return [];

    const categories = video.video_categories?.map(vc => vc.category) || [];
    const tags = video.video_tags?.map(vt => vt.tag) || [];

    // Find videos with similar categories or tags
    let query = supabase
      .from('videos')
      .select(`
        id,
        title,
        thumbnail_url,
        duration,
        views,
        channel_name,
        created_at,
        quality,
        keywords,
        meta_tags
      `)
      .eq('is_public', true)
      .neq('id', videoId)
      .limit(limit * 2); // Get more for scoring

    // Prefer same channel
    if (video.channel_name) {
      query = query.or(`channel_name.eq.${video.channel_name}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Score videos by similarity
    const scoredVideos = data.map(v => {
      let score = 0;

      // Same channel bonus
      if (v.channel_name === video.channel_name) score += 50;

      // Category matches
      const vCategories = v.video_categories?.map(vc => vc.category) || [];
      const categoryMatches = vCategories.filter(cat => categories.includes(cat)).length;
      score += categoryMatches * 30;

      // Tag matches
      const vTags = v.video_tags?.map(vt => vt.tag) || [];
      const tagMatches = vTags.filter(tag => tags.includes(tag)).length;
      score += tagMatches * 20;

      // Engagement score
      score += (v.views || 0) * 0.01;
      score += (v.likes || 0) * 0.5;

      return { ...v, similarity_score: score };
    });

    // Return top matches
    return scoredVideos
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

/**
 * Track video interaction
 */
export const trackInteraction = async (userId, videoId, interactionType, value = 1) => {
  if (!userId) return;

  try {
    await supabase
      .from('video_interactions')
      .insert({
        user_id: userId,
        video_id: videoId,
        interaction_type: interactionType,
        interaction_value: value
      });
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
};

/**
 * Get or create user preferences
 */
export const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No preferences found, create default
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          preferred_categories: [],
          preferred_languages: ['en'],
          blocked_channels: [],
          autoplay_enabled: true,
          mature_content_filter: false
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newPrefs;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Add category to video
 */
export const addVideoCategory = async (videoId, category, confidence = 1.0) => {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .upsert({
        video_id: videoId,
        category: category,
        confidence: confidence
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding video category:', error);
    throw error;
  }
};

/**
 * Add tag to video
 */
export const addVideoTag = async (videoId, tag) => {
  try {
    const { data, error } = await supabase
      .from('video_tags')
      .upsert({
        video_id: videoId,
        tag: tag.toLowerCase()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding video tag:', error);
    throw error;
  }
};

/**
 * Block a channel
 */
export const blockChannel = async (userId, channelName) => {
  try {
    const prefs = await getUserPreferences(userId);
    const blockedChannels = prefs?.blocked_channels || [];
    
    if (!blockedChannels.includes(channelName)) {
      blockedChannels.push(channelName);
      await updateUserPreferences(userId, {
        blocked_channels: blockedChannels
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error blocking channel:', error);
    throw error;
  }
};

/**
 * Unblock a channel
 */
export const unblockChannel = async (userId, channelName) => {
  try {
    const prefs = await getUserPreferences(userId);
    const blockedChannels = prefs?.blocked_channels || [];
    
    const filtered = blockedChannels.filter(name => name !== channelName);
    await updateUserPreferences(userId, {
      blocked_channels: filtered
    });

    return { success: true };
  } catch (error) {
    console.error('Error unblocking channel:', error);
    throw error;
  }
};

/**
 * Get user's interaction history
 */
export const getUserInteractions = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('video_interactions')
      .select(`
        *,
        videos (
          id,
          title,
          thumbnail_url,
          channel_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return [];
  }
};

/**
 * Refresh trending videos (should be called periodically)
 */
export const refreshTrendingVideos = async () => {
  try {
    const { error } = await supabase.rpc('refresh_trending_videos');
    if (error) throw error;
    console.log('✅ Trending videos refreshed');
    return { success: true };
  } catch (error) {
    console.error('Error refreshing trending videos:', error);
    return { success: false, error };
  }
};

/**
 * Search videos with filters
 */
export const searchVideosWithFilters = async (query, filters = {}) => {
  try {
    let supabaseQuery = supabase
      .from('videos')
      .select('*')
      .eq('is_public', true);

    // Text search
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,channel_name.ilike.%${query}%`
      );
    }

    // Category filter
    if (filters.category) {
      // Join with video_categories
      supabaseQuery = supabase
        .from('video_categories')
        .select(`
          video_id,
          videos (*)
        `)
        .eq('category', filters.category);
    }

    // Duration filter
    if (filters.minDuration) {
      supabaseQuery = supabaseQuery.gte('duration', filters.minDuration);
    }
    if (filters.maxDuration) {
      supabaseQuery = supabaseQuery.lte('duration', filters.maxDuration);
    }

    // Quality filter
    if (filters.quality) {
      supabaseQuery = supabaseQuery.eq('quality', filters.quality);
    }

    // Date filter
    if (filters.dateFrom) {
      supabaseQuery = supabaseQuery.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      supabaseQuery = supabaseQuery.lte('created_at', filters.dateTo);
    }

    // Sort
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    supabaseQuery = supabaseQuery.order(sortBy, sortOrder);

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error } = await supabaseQuery;
    if (error) throw error;

    // Extract videos if category filter was used
    if (filters.category && data) {
      return data.map(item => item.videos).filter(Boolean);
    }

    return data || [];
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};
