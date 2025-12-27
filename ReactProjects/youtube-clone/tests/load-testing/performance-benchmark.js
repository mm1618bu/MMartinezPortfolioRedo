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
        video_tags: Array.from(
          { length: 3 },
          () => ({ tag: tags[Math.floor(Math.random() * tags.length)] })
        ),
      });
    }
    return videos;
  }

  // Mock recommendation calculation
  calculateRecommendations(watchHistory, candidateVideos) {
    // Simulate some processing time
    let scoreMap = new Map();
    for (const video of candidateVideos) {
      let score = 0;
      for (const historyItem of watchHistory) {
        if (video.channel_name === historyItem.videos.channel_name) {
          score += 10;
        }
        const sharedCategories = video.video_categories.filter(vc =>
          historyItem.videos.video_categories.some(hc => hc.category === vc.category)
        );
        score += sharedCategories.length * 5;

        const sharedTags = video.video_tags.filter(vt =>
          historyItem.videos.video_tags.some(ht => ht.tag === vt.tag)
        );
        score += sharedTags.length * 2;
      }
      scoreMap.set(video.id, score);
    }
    return Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  // Run benchmark
  runTest(watchHistorySize, candidateVideoSize) {
    const watchHistory = this.generateMockWatchHistory(watchHistorySize);
    const candidateVideos = this.generateMockVideos(candidateVideoSize);

    const start = performance.now();
    this.calculateRecommendations(watchHistory, candidateVideos);
    const end = performance.now();

    const duration = end - start;
    this.results.tests.push({
      watchHistorySize,
      candidateVideoSize,
      duration,
    });
  }

  summarizeResults() {
    const totalTests = this.results.tests.length;
    const totalDuration = this.results.tests.reduce((sum, test) => sum + test.duration, 0);
    this.results.summary = {
      totalTests,
      averageDuration: totalDuration / totalTests,
    };
  }

  printResults() {
    console.log('Performance Benchmark Results:');
    this.results.tests.forEach((test, index) => {
      console.log(
        `Test ${index + 1}: Watch History Size = ${test.watchHistorySize}, Candidate Video Size = ${test.candidateVideoSize}, Duration = ${test.duration.toFixed(2)} ms`
      );
    });
    console.log('Summary:', this.results.summary);
  }
}