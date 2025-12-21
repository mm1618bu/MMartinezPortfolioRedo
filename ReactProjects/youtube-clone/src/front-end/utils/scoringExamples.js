/**
 * VIDEO SCORING SYSTEM - USAGE EXAMPLES
 * 
 * This file demonstrates how to use the video scoring system
 * in various scenarios throughout the application.
 */

import { 
  calculateVideoScore, 
  scoreAndRankVideos,
  getTrendingVideoScores,
  getTopRatedVideoScores,
  getRecommendedVideoScores,
  calculateVideoHealth,
  batchScoreVideos
} from './videoScoringSystem';

// ============================================
// EXAMPLE 1: Score a single video
// ============================================
export const exampleSingleVideoScore = (video) => {
  const score = calculateVideoScore(video, {
    engagementWeight: 0.4,
    recencyWeight: 0.3,
    qualityWeight: 0.2,
    keywordWeight: 0.1,
  });
  
  console.log('Video Score:', score.total);
  console.log('Breakdown:', score.breakdown);
  /*
   * Output:
   * Video Score: 72.5
   * Breakdown: {
   *   engagement: 80.2,
   *   recency: 65.5,
   *   quality: 80,
   *   keyword: 0
   * }
   */
};

// ============================================
// EXAMPLE 2: Get top-ranked videos
// ============================================
export const exampleTopRankedVideos = (allVideos) => {
  // Automatically scores and sorts by total score
  const rankedVideos = scoreAndRankVideos(allVideos);
  
  // Get top 10
  const top10 = rankedVideos.slice(0, 10);
  
  return top10;
};

// ============================================
// EXAMPLE 3: Get trending videos
// ============================================
export const exampleTrendingVideos = (allVideos) => {
  // Emphasizes recency (40%) and engagement (50%)
  const trending = getTrendingVideoScores(allVideos);
  
  return trending.slice(0, 20);
};

// ============================================
// EXAMPLE 4: Get recommended videos
// ============================================
export const exampleRecommendations = (allVideos, currentVideo) => {
  // Uses keyword matching + engagement for smart recommendations
  const recommendations = getRecommendedVideoScores(allVideos, currentVideo);
  
  return recommendations.slice(0, 10);
};

// ============================================
// EXAMPLE 5: Check video health (for creators)
// ============================================
export const exampleVideoHealth = (video) => {
  const health = calculateVideoHealth(video);
  
  switch (health.status) {
    case 'excellent':
      return '🌟 Your video is performing excellently!';
    case 'good':
      return '👍 Good performance!';
    case 'average':
      return '📊 Average performance';
    case 'new':
      return '🆕 Just uploaded, give it time';
    case 'needs-improvement':
      return '📉 Consider improving title, thumbnail, or content';
    default:
      return 'Unknown status';
  }
};

// ============================================
// EXAMPLE 6: Sort videos with custom weights
// ============================================
export const exampleCustomSort = (allVideos, sortType) => {
  let options = {};
  
  switch (sortType) {
    case 'viral':
      // Emphasize engagement and recency (viral content)
      options = {
        engagementWeight: 0.6,
        recencyWeight: 0.3,
        qualityWeight: 0.1,
        keywordWeight: 0,
      };
      break;
      
    case 'quality':
      // Emphasize quality and engagement
      options = {
        engagementWeight: 0.4,
        recencyWeight: 0.1,
        qualityWeight: 0.5,
        keywordWeight: 0,
      };
      break;
      
    case 'fresh':
      // Emphasize recency
      options = {
        engagementWeight: 0.2,
        recencyWeight: 0.6,
        qualityWeight: 0.2,
        keywordWeight: 0,
      };
      break;
      
    default:
      // Balanced
      options = {
        engagementWeight: 0.4,
        recencyWeight: 0.3,
        qualityWeight: 0.2,
        keywordWeight: 0.1,
      };
  }
  
  return scoreAndRankVideos(allVideos, options);
};

// ============================================
// EXAMPLE 7: Batch scoring for performance
// ============================================
export const exampleBatchScoring = (largeVideoList) => {
  // Only scores top 100 videos to save computation
  const scored = batchScoreVideos(largeVideoList, {
    engagementWeight: 0.4,
    recencyWeight: 0.3,
    qualityWeight: 0.2,
    keywordWeight: 0.1,
  }, 50);
  
  return scored;
};

// ============================================
// EXAMPLE 8: Filter by score threshold
// ============================================
export const exampleFilterByScore = (allVideos, minScore = 60) => {
  const scored = scoreAndRankVideos(allVideos);
  
  // Only return videos above threshold
  return scored.filter(v => v.score.total >= minScore);
};

// ============================================
// EXAMPLE 9: Compare two videos
// ============================================
export const exampleCompareVideos = (video1, video2) => {
  const score1 = calculateVideoScore(video1);
  const score2 = calculateVideoScore(video2);
  
  console.log(`Video 1: ${score1.total} (${score1.breakdown.engagement} engagement)`);
  console.log(`Video 2: ${score2.total} (${score2.breakdown.engagement} engagement)`);
  
  if (score1.total > score2.total) {
    console.log('Video 1 performs better overall');
  } else {
    console.log('Video 2 performs better overall');
  }
};

// ============================================
// EXAMPLE 10: Category-based recommendations
// ============================================
export const exampleCategoryRecommendations = (allVideos, category) => {
  // Filter by category keywords
  const categoryVideos = allVideos.filter(v => 
    v.keywords?.some(k => k.toLowerCase().includes(category.toLowerCase()))
  );
  
  // Score and rank within category
  return getTopRatedVideoScores(categoryVideos);
};

export default {
  exampleSingleVideoScore,
  exampleTopRankedVideos,
  exampleTrendingVideos,
  exampleRecommendations,
  exampleVideoHealth,
  exampleCustomSort,
  exampleBatchScoring,
  exampleFilterByScore,
  exampleCompareVideos,
  exampleCategoryRecommendations,
};
