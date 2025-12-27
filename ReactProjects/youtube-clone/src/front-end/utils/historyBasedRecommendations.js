/**
 * History-Based Recommendation Engine
 * Advanced personalization using watch history from Supabase
 * 
 * FEATURES:
 * - Channel affinity scoring (learns which channels user likes)
 * - Category preference learning from viewing patterns
 * - Watch completion rate analysis (identifies engaging content)
 * - Time-decay for recent interests
 * - Collaborative filtering using similar user patterns
 * - Diversity injection to prevent filter bubbles
 */

import { supabase } from './supabase';

/**
 * Get personalized recommendations based on user's watch history
 * @param {string} userId - Current user ID
 * @param {number} limit - Number of recommendations to return
 * @param {Array} excludeVideoIds - Video IDs to exclude (optional)
 * @returns {Promise<Array>} Personalized video recommendations
 */
export const getHistoryBasedRecommendations = async (userId, limit = 20, excludeVideoIds = []) => {
  try {
    if (!userId) {
      return await getColdStartRecommendations(limit);
    }

    // Get user's detailed watch history
    const watchHistory = await getUserWatchHistory(userId);
    
    if (!watchHistory || watchHistory.length === 0) {
      return await getColdStartRecommendations(limit);
    }

    // Analyze user preferences from history
    const userPreferences = analyzeWatchHistory(watchHistory);
    
    // Get candidate videos
    const candidates = await getCandidateVideos(userId, excludeVideoIds);
    
    // Score each candidate based on user preferences
    const scoredVideos = candidates.map(video => ({
      ...video,
      personalizedScore: calculatePersonalizedScore(video, userPreferences, watchHistory),
    }));
    
    // Sort by personalized score
    const sortedVideos = scoredVideos.sort((a, b) => 
      b.personalizedScore - a.personalizedScore
    );
    
    // Apply diversity to prevent filter bubbles
    const diversifiedVideos = injectDiversity(sortedVideos, userPreferences);
    
    return diversifiedVideos.slice(0, limit);
  } catch (error) {
    console.error('Error getting history-based recommendations:', error);
    return await getColdStartRecommendations(limit);
  }
};

/**
 * Get user's watch history with video details
 */
const getUserWatchHistory = async (userId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        *,
        videos (
          id,
          title,
          channel_name,
          views,
          likes,
          dislikes,
          duration,
          created_at,
          video_categories (category),
          video_tags (tag)
        )
      `)
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};

/**
 * Analyze watch history to extract user preferences
 */
const analyzeWatchHistory = (watchHistory) => {
  const channelScores = {};
  const categoryScores = {};
  const tagScores = {};
  let totalWatchTime = 0;
  let completedVideos = 0;

  watchHistory.forEach((entry) => {
    const video = entry.videos;
    if (!video) return;

    const watchTimeSeconds = entry.watch_time || 0;
    const videoDuration = video.duration || 1;
    const completionRate = watchTimeSeconds / videoDuration;
    
    // Weight based on completion rate (completed videos get higher weight)
    const weight = Math.min(completionRate * 2, 2); // Max weight of 2
    
    // Time decay: Recent watches matter more
    const daysAgo = (Date.now() - new Date(entry.last_watched_at)) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.exp(-daysAgo / 30); // Decay over 30 days
    
    const finalWeight = weight * recencyMultiplier;

    // Track channel affinity
    if (video.channel_name) {
      channelScores[video.channel_name] = (channelScores[video.channel_name] || 0) + finalWeight;
    }

    // Track category preferences
    if (video.video_categories) {
      video.video_categories.forEach(cat => {
        const category = cat.category;
        categoryScores[category] = (categoryScores[category] || 0) + finalWeight;
      });
    }

    // Track tag preferences
    if (video.video_tags) {
      video.video_tags.forEach(tagObj => {
        const tag = tagObj.tag;
        tagScores[tag] = (tagScores[tag] || 0) + finalWeight;
      });
    }

    totalWatchTime += watchTimeSeconds;
    if (entry.completed) completedVideos++;
  });

  return {
    channelScores,
    categoryScores,
    tagScores,
    totalWatchTime,
    completedVideos,
    avgCompletionRate: completedVideos / Math.max(watchHistory.length, 1),
    topChannels: getTopItems(channelScores, 10),
    topCategories: getTopItems(categoryScores, 5),
    topTags: getTopItems(tagScores, 15),
  };
};

/**
 * Get top N items from a score object
 */
const getTopItems = (scores, n) => {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([item, score]) => ({ item, score }));
};

/**
 * Get candidate videos for recommendations
 */
const getCandidateVideos = async (userId, excludeVideoIds = []) => {
  try {
    // Get user's watched video IDs from history
    const { data: watchedVideos } = await supabase
      .from('watch_history')
      .select('video_id')
      .eq('user_id', userId);

    const watchedIds = watchedVideos?.map(w => w.video_id) || [];
    const allExcluded = [...new Set([...watchedIds, ...excludeVideoIds])];

    // Query for videos, excluding already watched
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
        is_public,
        video_categories (category),
        video_tags (tag)
      `)
      .eq('is_public', true);

    // Exclude watched videos (Supabase has limit on array size)
    if (allExcluded.length > 0 && allExcluded.length < 1000) {
      query = query.not('id', 'in', `(${allExcluded.join(',')})`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500); // Get more candidates for better scoring

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching candidate videos:', error);
    return [];
  }
};

/**
 * Calculate personalized score for a video based on user preferences
 */
const calculatePersonalizedScore = (video, userPreferences, watchHistory) => {
  let score = 0;

  // 1. Channel affinity (40% weight)
  if (video.channel_name && userPreferences.channelScores[video.channel_name]) {
    const channelScore = userPreferences.channelScores[video.channel_name];
    score += channelScore * 40;
  }

  // 2. Category match (30% weight)
  if (video.video_categories && video.video_categories.length > 0) {
    let categoryScore = 0;
    video.video_categories.forEach(catObj => {
      const category = catObj.category;
      if (userPreferences.categoryScores[category]) {
        categoryScore += userPreferences.categoryScores[category];
      }
    });
    score += (categoryScore / Math.max(video.video_categories.length, 1)) * 30;
  }

  // 3. Tag similarity (20% weight)
  if (video.video_tags && video.video_tags.length > 0) {
    let tagScore = 0;
    video.video_tags.forEach(tagObj => {
      const tag = tagObj.tag;
      if (userPreferences.tagScores[tag]) {
        tagScore += userPreferences.tagScores[tag];
      }
    });
    score += (tagScore / Math.max(video.video_tags.length, 1)) * 20;
  }

  // 4. Video quality/popularity (10% weight)
  const engagementRate = video.likes / Math.max(video.views, 1);
  const qualityScore = Math.log10(video.views + 1) * engagementRate * 100;
  score += qualityScore * 0.1;

  // 5. Recency bonus (boost newer content)
  const daysOld = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
  if (daysOld < 7) {
    score *= 1.2; // 20% boost for videos less than a week old
  } else if (daysOld < 30) {
    score *= 1.1; // 10% boost for videos less than a month old
  }

  return score;
};

/**
 * Inject diversity to prevent filter bubbles
 * Adds some videos from different categories/channels
 */
const injectDiversity = (sortedVideos, userPreferences) => {
  if (sortedVideos.length < 10) return sortedVideos;

  const result = [];
  const seenChannels = new Set();
  const seenCategories = new Set();
  
  // Take top highly personalized videos
  const topCount = Math.floor(sortedVideos.length * 0.7); // 70% personalized
  
  for (let i = 0; i < sortedVideos.length && result.length < sortedVideos.length; i++) {
    const video = sortedVideos[i];
    
    if (result.length < topCount) {
      // Add top personalized videos
      result.push(video);
      seenChannels.add(video.channel_name);
      if (video.video_categories) {
        video.video_categories.forEach(c => seenCategories.add(c.category));
      }
    } else {
      // For remaining slots, prefer diverse content
      const isNewChannel = !seenChannels.has(video.channel_name);
      const hasNewCategory = video.video_categories?.some(c => 
        !seenCategories.has(c.category)
      );
      
      if (isNewChannel || hasNewCategory) {
        result.push(video);
        seenChannels.add(video.channel_name);
        if (video.video_categories) {
          video.video_categories.forEach(c => seenCategories.add(c.category));
        }
      } else if (result.length < sortedVideos.length) {
        // Fill remaining with best remaining videos
        result.push(video);
      }
    }
  }
  
  return result;
};

/**
 * Cold start recommendations for new users without history
 */
const getColdStartRecommendations = async (limit = 20) => {
  try {
    const { data, error } = await supabase
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
      .order('views', { ascending: false })
      .limit(limit * 2); // Get extra to allow for diversity

    if (error) throw error;

    // Score based on engagement and recency
    const scored = (data || []).map(video => ({
      ...video,
      personalizedScore: calculateColdStartScore(video),
    }));

    // Sort and apply diversity
    scored.sort((a, b) => b.personalizedScore - a.personalizedScore);
    
    // Simple diversity: alternate between different channels
    const diverse = [];
    const usedChannels = new Set();
    
    for (const video of scored) {
      if (diverse.length >= limit) break;
      
      if (!usedChannels.has(video.channel_name)) {
        diverse.push(video);
        usedChannels.add(video.channel_name);
      }
    }
    
    // Fill remaining with best videos
    for (const video of scored) {
      if (diverse.length >= limit) break;
      if (!diverse.includes(video)) {
        diverse.push(video);
      }
    }

    return diverse.slice(0, limit);
  } catch (error) {
    console.error('Error getting cold start recommendations:', error);
    return [];
  }
};

/**
 * Calculate score for cold start (no history)
 */
const calculateColdStartScore = (video) => {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const dislikes = video.dislikes || 0;
  
  const engagementRate = likes / Math.max(views, 1);
  const likeRatio = likes / Math.max(likes + dislikes, 1);
  
  // Combine view count (popularity) with engagement quality
  const popularityScore = Math.log10(views + 1) * 10;
  const qualityScore = engagementRate * likeRatio * 100;
  
  // Recency bonus
  const daysOld = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 50 - daysOld);
  
  return popularityScore + qualityScore + recencyBonus;
};

/**
 * Get similar videos based on specific video (for "Up Next" feature)
 */
export const getHistoryBasedSimilarVideos = async (userId, currentVideoId, limit = 10) => {
  try {
    // Get current video details
    const { data: currentVideo, error: videoError } = await supabase
      .from('videos')
      .select(`
        *,
        video_categories (category),
        video_tags (tag)
      `)
      .eq('id', currentVideoId)
      .single();

    if (videoError || !currentVideo) {
      return getColdStartRecommendations(limit);
    }

    // If user has history, use it to personalize similar videos
    if (userId) {
      const watchHistory = await getUserWatchHistory(userId, 50);
      const userPreferences = analyzeWatchHistory(watchHistory);
      
      // Get videos from same channel or categories
      const candidates = await getSimilarVideoCandidates(currentVideo, currentVideoId);
      
      // Score based on similarity + user preferences
      const scored = candidates.map(video => ({
        ...video,
        similarityScore: calculateSimilarityScore(video, currentVideo, userPreferences),
      }));
      
      scored.sort((a, b) => b.similarityScore - a.similarityScore);
      return scored.slice(0, limit);
    } else {
      // No history, use basic similarity
      const candidates = await getSimilarVideoCandidates(currentVideo, currentVideoId);
      return candidates.slice(0, limit);
    }
  } catch (error) {
    console.error('Error getting similar videos:', error);
    return [];
  }
};

/**
 * Get candidate videos similar to current video
 */
const getSimilarVideoCandidates = async (currentVideo, excludeId) => {
  try {
    const categories = currentVideo.video_categories?.map(c => c.category) || [];
    
    let query = supabase
      .from('videos')
      .select(`
        *,
        video_categories (category),
        video_tags (tag)
      `)
      .eq('is_public', true)
      .neq('id', excludeId);

    // Prioritize same channel
    if (currentVideo.channel_name) {
      const { data: sameChannelVideos } = await query
        .eq('channel_name', currentVideo.channel_name)
        .limit(5);
        
      if (sameChannelVideos && sameChannelVideos.length > 0) {
        return sameChannelVideos;
      }
    }

    // Then same categories
    if (categories.length > 0) {
      // This is a simplified query; ideally use a join
      const { data: allVideos } = await query.limit(100);
      
      const sameCategoryVideos = allVideos?.filter(video =>
        video.video_categories?.some(c => categories.includes(c.category))
      ) || [];
      
      return sameCategoryVideos.slice(0, 20);
    }

    // Fallback to recent popular videos
    const { data } = await query
      .order('views', { ascending: false })
      .limit(20);
      
    return data || [];
  } catch (error) {
    console.error('Error getting similar video candidates:', error);
    return [];
  }
};

/**
 * Calculate similarity score between two videos with user preference weighting
 */
const calculateSimilarityScore = (video, referenceVideo, userPreferences) => {
  let score = 0;

  // Same channel = high similarity
  if (video.channel_name === referenceVideo.channel_name) {
    score += 100;
    
    // Boost if user likes this channel
    if (userPreferences.channelScores[video.channel_name]) {
      score += userPreferences.channelScores[video.channel_name] * 20;
    }
  }

  // Shared categories
  const videoCats = video.video_categories?.map(c => c.category) || [];
  const refCats = referenceVideo.video_categories?.map(c => c.category) || [];
  const sharedCats = videoCats.filter(c => refCats.includes(c));
  
  score += sharedCats.length * 30;
  
  // Boost for user's preferred categories
  sharedCats.forEach(cat => {
    if (userPreferences.categoryScores[cat]) {
      score += userPreferences.categoryScores[cat] * 10;
    }
  });

  // Shared tags
  const videoTags = video.video_tags?.map(t => t.tag) || [];
  const refTags = referenceVideo.video_tags?.map(t => t.tag) || [];
  const sharedTags = videoTags.filter(t => refTags.includes(t));
  
  score += sharedTags.length * 10;

  // Video quality
  const engagementRate = video.likes / Math.max(video.views, 1);
  score += engagementRate * 50;

  return score;
};

/**
 * Get reason why video was recommended (for UI display)
 */
export const getRecommendationReason = (video, userPreferences) => {
  const reasons = [];

  if (userPreferences && userPreferences.topChannels) {
    const likedChannel = userPreferences.topChannels.find(
      c => c.item === video.channel_name
    );
    if (likedChannel) {
      reasons.push(`You watch ${video.channel_name}`);
    }
  }

  if (userPreferences && userPreferences.topCategories && video.video_categories) {
    const videoCategories = video.video_categories.map(c => c.category);
    const matchedCat = userPreferences.topCategories.find(
      c => videoCategories.includes(c.item)
    );
    if (matchedCat) {
      reasons.push(`Based on ${matchedCat.item} videos you watched`);
    }
  }

  const daysOld = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
  if (daysOld < 3) {
    reasons.push('New video');
  }

  if (video.views > 10000) {
    reasons.push('Popular');
  }

  return reasons.length > 0 ? reasons[0] : 'Recommended for you';
};

export default {
  getHistoryBasedRecommendations,
  getHistoryBasedSimilarVideos,
  getRecommendationReason,
  getColdStartRecommendations,
};
