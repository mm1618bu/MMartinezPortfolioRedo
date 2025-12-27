/**
 * Generate Test Data for Load Testing
 * Creates mock users, videos, and watch history for testing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  numUsers: 100,
  numVideos: 500,
  numChannels: 50,
  categories: [
    'Technology', 'Gaming', 'Education', 'Entertainment', 'Music',
    'Sports', 'News', 'Cooking', 'Travel', 'Fitness', 'Comedy',
    'Science', 'Art', 'Fashion', 'DIY', 'Automotive', 'Pets'
  ],
  tags: [
    'tutorial', 'review', 'funny', 'viral', 'trending', 'howto',
    'gaming', 'music', 'vlog', 'educational', 'commentary', 'reaction',
    'unboxing', 'challenge', 'tips', 'guide', 'news', 'analysis'
  ],
};

// Generate random ID
function generateId(prefix = '') {
  return `${prefix}${Math.random().toString(36).substring(2, 15)}`;
}

// Generate random date within last N days
function randomDate(days = 90) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString();
}

// Generate channels
function generateChannels(count) {
  const channels = [];
  for (let i = 0; i < count; i++) {
    channels.push({
      id: generateId('channel-'),
      name: `Channel ${i + 1}`,
      subscribers: Math.floor(Math.random() * 1000000),
      verified: Math.random() > 0.7,
      created_at: randomDate(730), // Up to 2 years ago
    });
  }
  return channels;
}

// Generate videos
function generateVideos(count, channels) {
  const videos = [];
  for (let i = 0; i < count; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const numTags = Math.floor(Math.random() * 5) + 2;
    