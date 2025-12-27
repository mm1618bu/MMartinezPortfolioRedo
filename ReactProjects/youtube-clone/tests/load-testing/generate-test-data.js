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
    videos.push({
      id: generateId('video-'),
      title: `Video Title ${i + 1}`,
      description: `This is the description for video ${i + 1}.`,
      channel_id: channel.id,
      channel_name: channel.name,
      views: Math.floor(Math.random() * 1000000),
      likes: Math.floor(Math.random() * 50000),
      dislikes: Math.floor(Math.random() * 5000),
      created_at: randomDate(365), // Up to 1 year ago
      categories: shuffleArray(CONFIG.categories).slice(0, numCategories),
      tags: shuffleArray(CONFIG.tags).slice(0, numTags),
      duration: Math.floor(Math.random() * 1800) + 60, // 1 min to 30 min
    });
  }
  return videos;
}

// Generate users with watch history
function generateUsers(count, videos) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const historySize = Math.floor(Math.random() * 50) + 1;
    const watchHistory = [];
    const shuffledVideos = shuffleArray(videos);
    for (let j = 0; j < historySize; j++) {
      watchHistory.push({
        video_id: shuffledVideos[j].id,
        watched_at: randomDate(30), // Watched within last 30 days
      });
    }
    users.push({
      id: generateId('user-'),
      name: `User ${i + 1}`,
      watch_history: watchHistory,
    });
  }
  return users;
}

// Shuffle array utility
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Main function to generate and save test data 
function generateTestData() {
  const channels = generateChannels(CONFIG.numChannels);
  const videos = generateVideos(CONFIG.numVideos, channels);
  const users = generateUsers(CONFIG.numUsers, videos);

  const testData = {
    channels,
    videos,
    users,
  };

  const outputPath = path.join(__dirname, 'test-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));
  console.log(`Test data generated and saved to ${outputPath}`);
}

// Run the data generation
generateTestData();