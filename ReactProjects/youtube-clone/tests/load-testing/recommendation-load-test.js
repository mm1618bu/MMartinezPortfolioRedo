/**
 * Load Testing Script for Personalized Recommendations
 * 
 * Uses k6 for load testing the recommendation system
 * Install k6: https://k6.io/docs/getting-started/installation/
 * 
 * Run: k6 run recommendation-load-test.js
 * Run with options: k6 run --vus 50 --duration 30s recommendation-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const recommendationErrors = new Rate('recommendation_errors');
const recommendationDuration = new Trend('recommendation_duration');
const recommendationSuccess = new Counter('recommendation_success');
const dbQueryDuration = new Trend('db_query_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Peak at 100 users
    { duration: '1m', target: 50 },    // Ramp down to 50
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],     // Less than 5% failures
    'recommendation_errors': ['rate<0.1'], // Less than 10% recommendation errors
    'recommendation_duration': ['p(95)<3000'], // 95% of recommendations under 3s
  },
};

// Test data - mock user IDs and video IDs
const TEST_USERS = generateTestUsers(100);
const TEST_VIDEOS = generateTestVideos(500);
const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY || '';

function generateTestUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `test-user-${i}`,
      hasHistory: Math.random() > 0.3, // 70% have watch history
      historySize: Math.floor(Math.random() * 50) + 1,
    });
  }
  return users;
}

function generateTestVideos(count) {
  const videos = [];
  for (let i = 0; i < count; i++) {
    videos.push(`test-video-${i}`);
  }
  return videos;
}

export default function () {
  // Pick a random user
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  group(`User ${user.id} Recommendation Load Test`, () => {
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
    };    
    const url = `${SUPABASE_URL}/recommendations?userId=${user.id}`;

    const startTime = new Date().getTime();
    const res = http.get(url, params);
    const duration = new Date().getTime() - startTime;

    recommendationDuration.add(duration);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'has recommendations': (r) => {
        const data = r.json();
        return data && data.recommendations && data.recommendations.length > 0;
      },
    });

    if (success) {
      recommendationSuccess.add(1);
    } else {
      recommendationErrors.add(1);
    }

    // Simulate DB query time metric (mocked)
    const dbQueryTime = Math.random() * 500; // Mock DB query time between 0-500ms
    dbQueryDuration.add(dbQueryTime);

    sleep(1 + Math.random() * 2); // Sleep between 1-3 seconds
  });
}
  scoreAndRankVideos,
  getTopRatedVideoScores,
  getRecommendedVideoScores,
  calculateVideoHealth,
  batchScoreVideos,
};



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
   *   keyword: 70
   * }
   */
}