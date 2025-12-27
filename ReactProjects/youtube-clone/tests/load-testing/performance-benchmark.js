/**
 * Performance Benchmark for Recommendation Algorithm
 * Tests the performance of recommendation calculations locally
 */

const { performance } = require('perf_hooks');

// Mock the recommendation functions
class RecommendationBenchmark {
  constructor() {
    this.results = {
      tests: [],
      summary: {},
    };
  }

  // Generate mock data
  generateMockWatchHistory(size) {
    const history = [];
    const channels = ['TechChannel', 'GameChannel', 'CookingChannel', 'MusicChannel', 'SportsChannel'];
    const categories = ['Technology', 'Gaming', 'Cooking', 'Music', 'Sports'];
    const tags = ['tutorial', 'review', 'gameplay', 'recipe', 'news', 'guide'];
    
    for (let i = 0; i < size; i++) {
      history.push({
        videos: {
          id: `video-${i}`,
          channel_name: channels[Math.floor(Math.random() * channels.length)],
          duration: 600,
          video_categories: [{ category: categories[Math.floor(Math.random() * categories.length)] }],
          video_tags: Array.from(
            { length: 3 },
            () => ({ tag: tags[Math.floor(Math.random() * tags.length)] })
          ),
        },
        watch_time: Math.floor(Math.random() * 600),
        completed: Math.random() > 0.5,
        last_watched_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    return history;
  }

  generateMockVideos(size) {
    const videos = [];
    const channels = ['TechChannel', 'GameChannel', 'CookingChannel', 'MusicChannel', 'SportsChannel'];
    const categories = ['Technology', 'Gaming', 'Cooking', 'Music', 'Sports'];
    const tags = ['tutorial', 'review', 'gameplay', 'recipe', 'news', 'guide'];
    
    for (let i = 0; i < size; i++) {
      videos.push({
        id: `candidate-${i}`,
        title: `Video ${i}`,
        channel_name: channels[Math.floor(Math.random() * channels.length)],
        views: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 5000),
        dislikes: Math.floor(Math.random() * 500),
        duration: 600,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        video_categories: [{ category: categories[Math.floor(Math.random() * categories.length)] }],