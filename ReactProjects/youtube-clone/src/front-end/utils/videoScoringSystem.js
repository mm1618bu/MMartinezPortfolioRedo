/**
 * Lightweight Video Scoring System
 * Calculates relevance and quality scores for videos based on multiple factors
 * 
 * SCORING FACTORS:
 * - Engagement (likes, views, comments)
 * - Recency (newer videos get bonus)
 * - Quality metrics (resolution, encoding quality)
 * - User preferences (watch history, liked categories)
 */

/**
 * Calculate engagement score (0-100)
 * Based on likes, dislikes, views, and engagement rate
 */
export const calculateEngagementScore = (video) => {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const dislikes = video.dislikes || 0;
  
  // Avoid division by zero
  if (views === 0) return 0;
  
  // Like ratio (0-1)
  const totalReactions = likes + dislikes;
  const likeRatio = totalReactions > 0 ? likes / totalReactions : 0.5;
  
  // Engagement rate (likes per view)
  const engagementRate = likes / views;
  
  // Logarithmic view score (diminishing returns for very high views)
  const viewScore = Math.log10(views + 1) / 6; // Normalize to ~0-1 range
  
  // Weighted combination
  const score = (
    likeRatio * 0.4 +        // 40% like ratio
    engagementRate * 0.3 +   // 30% engagement rate
    viewScore * 0.3          // 30% view popularity
  ) * 100;
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate recency score (0-100)
 * Newer videos get higher scores with exponential decay
 */
export const calculateRecencyScore = (video) => {
  if (!video.created_at) return 50; // Default score
  
  const now = new Date();
  const createdDate = new Date(video.created_at);
  const ageInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: score = 100 * e^(-k * days)
  // k = 0.1 means half-life of ~7 days
  const k = 0.1;
  const score = 100 * Math.exp(-k * ageInDays);
  
  return Math.min(100, Math.max(0, score));
};

/**
 * Calculate quality score (0-100)
 * Based on video resolution and technical quality
 */
export const calculateQualityScore = (video) => {
  const qualityMap = {
    '4k': 100,
    '2160p': 100,
    '1440p': 90,
    '1080p': 80,
    '720p': 60,
    '480p': 40,
    '360p': 20,
    '240p': 10,
  };
  
  const quality = video.quality || video.resolution || '720p';
  return qualityMap[quality.toLowerCase()] || 50;
};

/**
 * Calculate keyword match score (0-100)
 * Used for content-based recommendations
 */
export const calculateKeywordMatchScore = (video, targetKeywords = []) => {
  if (!targetKeywords || targetKeywords.length === 0) return 0;
  if (!video.keywords || video.keywords.length === 0) return 0;
  
  const videoKeywords = video.keywords.map(k => k.toLowerCase());
  const targetKeywordsLower = targetKeywords.map(k => k.toLowerCase());
  
  // Count matching keywords
  const matches = videoKeywords.filter(k => 
    targetKeywordsLower.includes(k)
  ).length;
  
  // Score based on percentage of matching keywords
  const matchPercentage = matches / Math.max(videoKeywords.length, targetKeywordsLower.length);
  return matchPercentage * 100;
};

/**
 * Calculate overall video score with customizable weights
 * Returns a score between 0-100
 */
export const calculateVideoScore = (video, options = {}) => {
  const {
    engagementWeight = 0.4,
    recencyWeight = 0.3,
    qualityWeight = 0.2,
    keywordWeight = 0.1,
    targetKeywords = [],
  } = options;
  
  const engagementScore = calculateEngagementScore(video);
  const recencyScore = calculateRecencyScore(video);
  const qualityScore = calculateQualityScore(video);
  const keywordScore = calculateKeywordMatchScore(video, targetKeywords);
  
  const totalScore = (
    engagementScore * engagementWeight +
    recencyScore * recencyWeight +
    qualityScore * qualityWeight +
    keywordScore * keywordWeight
  );
  
  return {
    total: Math.round(totalScore * 10) / 10,
    breakdown: {
      engagement: Math.round(engagementScore * 10) / 10,
      recency: Math.round(recencyScore * 10) / 10,
      quality: Math.round(qualityScore * 10) / 10,
      keyword: Math.round(keywordScore * 10) / 10,
    }
  };
};

/**
 * Score and rank a list of videos
 * Returns videos with scores, sorted by score descending
 */
export const scoreAndRankVideos = (videos, options = {}) => {
  return videos
    .map(video => ({
      ...video,
      score: calculateVideoScore(video, options),
    }))
    .sort((a, b) => b.score.total - a.score.total);
};

/**
 * Get trending videos (emphasis on recency and engagement)
 */
export const getTrendingVideoScores = (videos) => {
  return scoreAndRankVideos(videos, {
    engagementWeight: 0.5,
    recencyWeight: 0.4,
    qualityWeight: 0.1,
    keywordWeight: 0,
  });
};

/**
 * Get top-rated videos (emphasis on engagement)
 */
export const getTopRatedVideoScores = (videos) => {
  return scoreAndRankVideos(videos, {
    engagementWeight: 0.7,
    recencyWeight: 0.1,
    qualityWeight: 0.2,
    keywordWeight: 0,
  });
};

/**
 * Get recommended videos based on a reference video
 */
export const getRecommendedVideoScores = (videos, referenceVideo) => {
  const targetKeywords = referenceVideo?.keywords || [];
  
  // Filter out the reference video
  const filteredVideos = videos.filter(v => v.id !== referenceVideo?.id);
  
  return scoreAndRankVideos(filteredVideos, {
    engagementWeight: 0.3,
    recencyWeight: 0.2,
    qualityWeight: 0.2,
    keywordWeight: 0.3,
    targetKeywords,
  });
};

/**
 * Calculate video health score (for content creators)
 * Indicates how well a video is performing
 */
export const calculateVideoHealth = (video) => {
  const engagementScore = calculateEngagementScore(video);
  const recencyScore = calculateRecencyScore(video);
  const views = video.views || 0;
  
  // Health categories
  if (engagementScore >= 70 && views > 1000) return { status: 'excellent', score: engagementScore };
  if (engagementScore >= 50 && views > 500) return { status: 'good', score: engagementScore };
  if (engagementScore >= 30) return { status: 'average', score: engagementScore };
  if (engagementScore < 30 && recencyScore > 70) return { status: 'new', score: engagementScore };
  return { status: 'needs-improvement', score: engagementScore };
};

/**
 * Batch score videos efficiently (for large lists)
 */
export const batchScoreVideos = (videos, options = {}, limit = 50) => {
  // Only score top N videos to save computation
  const scored = scoreAndRankVideos(videos.slice(0, limit * 2), options);
  return scored.slice(0, limit);
};

export default {
  calculateEngagementScore,
  calculateRecencyScore,
  calculateQualityScore,
  calculateKeywordMatchScore,
  calculateVideoScore,
  scoreAndRankVideos,
  getTrendingVideoScores,
  getTopRatedVideoScores,
  getRecommendedVideoScores,
  calculateVideoHealth,
  batchScoreVideos,
};
