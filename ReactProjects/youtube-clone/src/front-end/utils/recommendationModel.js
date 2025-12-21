/**
 * Basic Recommendation Model
 * Combines popularity metrics with user interests for personalized recommendations
 * 
 * FEATURES:
 * - Tracks user interests from watch history
 * - Combines popularity (views, engagement) with personal preferences
 * - Keyword-based interest profiling
 * - Collaborative filtering basics
 */

import { calculateVideoScore } from './videoScoringSystem';

/**
 * User Interest Profile Structure
 * {
 *   keywords: { 'javascript': 5, 'react': 3, ... },
 *   watchedVideos: ['vid1', 'vid2', ...],
 *   likedVideos: ['vid3', 'vid4', ...],
 *   lastUpdated: timestamp
 * }
 */

const STORAGE_KEY = 'userInterestProfile';
const MAX_HISTORY = 50;

/**
 * Get user interest profile from localStorage
 */
export const getUserProfile = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        keywords: {},
        watchedVideos: [],
        likedVideos: [],
        lastUpdated: Date.now(),
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading user profile:', error);
    return {
      keywords: {},
      watchedVideos: [],
      likedVideos: [],
      lastUpdated: Date.now(),
    };
  }
};

/**
 * Save user interest profile to localStorage
 */
export const saveUserProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

/**
 * Track video watch (updates user interests)
 */
export const trackVideoWatch = (video) => {
  if (!video) return;
  
  const profile = getUserProfile();
  
  // Add to watched videos (keep last MAX_HISTORY)
  if (!profile.watchedVideos.includes(video.id)) {
    profile.watchedVideos.unshift(video.id);
    if (profile.watchedVideos.length > MAX_HISTORY) {
      profile.watchedVideos = profile.watchedVideos.slice(0, MAX_HISTORY);
    }
  }
  
  // Update keyword interests
  if (video.keywords && Array.isArray(video.keywords)) {
    video.keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      profile.keywords[key] = (profile.keywords[key] || 0) + 1;
    });
  }
  
  profile.lastUpdated = Date.now();
  saveUserProfile(profile);
};

/**
 * Track video like (stronger signal than watch)
 */
export const trackVideoLike = (video) => {
  if (!video) return;
  
  const profile = getUserProfile();
  
  // Add to liked videos
  if (!profile.likedVideos.includes(video.id)) {
    profile.likedVideos.unshift(video.id);
  }
  
  // Boost keyword interests (likes are stronger signal)
  if (video.keywords && Array.isArray(video.keywords)) {
    video.keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      profile.keywords[key] = (profile.keywords[key] || 0) + 3; // 3x weight for likes
    });
  }
  
  profile.lastUpdated = Date.now();
  saveUserProfile(profile);
};

/**
 * Get top user interests (keywords)
 */
export const getTopInterests = (limit = 10) => {
  const profile = getUserProfile();
  
  return Object.entries(profile.keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, score]) => ({ keyword, score }));
};

/**
 * Calculate interest score for a video based on user profile
 * Returns 0-100
 */
export const calculateInterestScore = (video, userProfile = null) => {
  const profile = userProfile || getUserProfile();
  
  if (!video.keywords || !Array.isArray(video.keywords)) {
    return 0;
  }
  
  // Calculate keyword match score
  let totalInterestScore = 0;
  let matchedKeywords = 0;
  
  video.keywords.forEach(keyword => {
    const key = keyword.toLowerCase();
    if (profile.keywords[key]) {
      totalInterestScore += profile.keywords[key];
      matchedKeywords++;
    }
  });
  
  // Normalize to 0-100 scale
  if (matchedKeywords === 0) return 0;
  
  // Use logarithmic scale to prevent dominance
  const avgScore = totalInterestScore / matchedKeywords;
  const normalizedScore = Math.min(100, (Math.log10(avgScore + 1) / Math.log10(101)) * 100);
  
  return normalizedScore;
};

/**
 * Get personalized recommendations
 * Combines popularity score with user interests
 */
export const getPersonalizedRecommendations = (videos, options = {}) => {
  const {
    limit = 20,
    popularityWeight = 0.5,  // Weight for popularity/engagement
    interestWeight = 0.5,    // Weight for user interests
    excludeWatched = true,   // Exclude already watched videos
    diversityBonus = true,   // Boost diversity in recommendations
  } = options;
  
  const profile = getUserProfile();
  
  // Filter out watched videos if requested
  let candidateVideos = videos;
  if (excludeWatched && profile.watchedVideos.length > 0) {
    candidateVideos = videos.filter(v => !profile.watchedVideos.includes(v.id));
  }
  
  // Calculate combined scores
  const scoredVideos = candidateVideos.map(video => {
    // Get popularity score (from existing scoring system)
    const popularityScore = calculateVideoScore(video, {
      engagementWeight: 0.5,
      recencyWeight: 0.3,
      qualityWeight: 0.2,
      keywordWeight: 0,
    }).total;
    
    // Get interest score
    const interestScore = calculateInterestScore(video, profile);
    
    // Combined score
    const combinedScore = (popularityScore * popularityWeight) + (interestScore * interestWeight);
    
    return {
      ...video,
      recommendationScore: combinedScore,
      popularityScore,
      interestScore,
    };
  });
  
  // Sort by combined score
  let recommendations = scoredVideos.sort((a, b) => b.recommendationScore - a.recommendationScore);
  
  // Apply diversity bonus if enabled
  if (diversityBonus) {
    recommendations = applyDiversityBonus(recommendations, profile);
  }
  
  return recommendations.slice(0, limit);
};

/**
 * Apply diversity bonus to avoid showing too many similar videos
 */
const applyDiversityBonus = (videos, profile) => {
  const result = [];
  const usedKeywords = new Set();
  const topInterests = Object.keys(profile.keywords).slice(0, 5);
  
  // First, add top-scored videos from user's interests
  videos.forEach(video => {
    if (result.length >= videos.length) return;
    
    const hasTopInterest = video.keywords?.some(k => 
      topInterests.includes(k.toLowerCase())
    );
    
    if (hasTopInterest) {
      result.push(video);
      video.keywords?.forEach(k => usedKeywords.add(k.toLowerCase()));
    }
  });
  
  // Then fill with diverse content
  videos.forEach(video => {
    if (result.includes(video)) return;
    if (result.length >= videos.length) return;
    
    // Check if video introduces new keywords
    const newKeywords = video.keywords?.filter(k => 
      !usedKeywords.has(k.toLowerCase())
    ) || [];
    
    if (newKeywords.length > 0) {
      result.push(video);
      newKeywords.forEach(k => usedKeywords.add(k.toLowerCase()));
    }
  });
  
  // Fill remaining slots with highest scoring videos
  videos.forEach(video => {
    if (!result.includes(video) && result.length < videos.length) {
      result.push(video);
    }
  });
  
  return result;
};

/**
 * Get trending recommendations (balanced for all users)
 * Less personalization, more general appeal
 */
export const getTrendingRecommendations = (videos, limit = 20) => {
  return getPersonalizedRecommendations(videos, {
    limit,
    popularityWeight: 0.8,
    interestWeight: 0.2,
    excludeWatched: false,
    diversityBonus: true,
  });
};

/**
 * Get "For You" recommendations (highly personalized)
 * More emphasis on user interests
 */
export const getForYouRecommendations = (videos, limit = 20) => {
  return getPersonalizedRecommendations(videos, {
    limit,
    popularityWeight: 0.3,
    interestWeight: 0.7,
    excludeWatched: true,
    diversityBonus: true,
  });
};

/**
 * Get similar videos based on a reference video
 */
export const getSimilarVideos = (videos, referenceVideo, limit = 10) => {
  if (!referenceVideo) return [];
  
  const referenceKeywords = referenceVideo.keywords || [];
  
  // Score videos by keyword overlap
  const scored = videos
    .filter(v => v.id !== referenceVideo.id)
    .map(video => {
      const videoKeywords = video.keywords || [];
      const overlap = videoKeywords.filter(k => 
        referenceKeywords.includes(k)
      ).length;
      
      const similarityScore = referenceKeywords.length > 0 
        ? (overlap / referenceKeywords.length) * 100 
        : 0;
      
      const popularityScore = calculateVideoScore(video, {
        engagementWeight: 0.6,
        recencyWeight: 0.2,
        qualityWeight: 0.2,
        keywordWeight: 0,
      }).total;
      
      return {
        ...video,
        similarityScore,
        popularityScore,
        combinedScore: (similarityScore * 0.7) + (popularityScore * 0.3),
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);
  
  return scored.slice(0, limit);
};

/**
 * Cold start recommendations (for new users with no history)
 */
export const getColdStartRecommendations = (videos, limit = 20) => {
  // Just use popularity for new users
  return videos
    .map(video => ({
      ...video,
      score: calculateVideoScore(video, {
        engagementWeight: 0.5,
        recencyWeight: 0.3,
        qualityWeight: 0.2,
        keywordWeight: 0,
      }),
    }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);
};

/**
 * Clear user profile (reset recommendations)
 */
export const clearUserProfile = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get recommendation explanation (why this video was recommended)
 */
export const getRecommendationReason = (video) => {
  const profile = getUserProfile();
  const interestScore = calculateInterestScore(video, profile);
  const popularityScore = calculateVideoScore(video).total;
  
  const reasons = [];
  
  if (interestScore > 60) {
    const matchedKeywords = video.keywords?.filter(k => 
      profile.keywords[k.toLowerCase()]
    ) || [];
    reasons.push(`Matches your interests: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }
  
  if (popularityScore > 70) {
    reasons.push('Popular and highly rated');
  }
  
  if (video.views > 10000) {
    reasons.push(`${(video.views / 1000).toFixed(1)}K views`);
  }
  
  const ageInDays = (Date.now() - new Date(video.created_at)) / (1000 * 60 * 60 * 24);
  if (ageInDays < 7) {
    reasons.push('New this week');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
};

export default {
  getUserProfile,
  saveUserProfile,
  trackVideoWatch,
  trackVideoLike,
  getTopInterests,
  calculateInterestScore,
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getForYouRecommendations,
  getSimilarVideos,
  getColdStartRecommendations,
  clearUserProfile,
  getRecommendationReason,
};
