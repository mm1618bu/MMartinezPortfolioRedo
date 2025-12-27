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