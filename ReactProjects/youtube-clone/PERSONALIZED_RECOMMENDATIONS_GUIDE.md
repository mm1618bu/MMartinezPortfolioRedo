# Personalized Recommendations Using Watch History

## Overview

The YouTube Clone now features an advanced **history-based recommendation engine** that learns from user behavior to provide highly personalized video suggestions. This system analyzes watch patterns, channel preferences, category interests, and completion rates to deliver relevant content while preventing filter bubbles through diversity injection.

## Key Features

### 🎯 Intelligent Learning
- **Channel Affinity**: Learns which channels users prefer based on watch frequency
- **Category Preferences**: Identifies favorite video categories from viewing patterns  
- **Tag Analysis**: Tracks interest keywords and topics
- **Completion Rate Tracking**: Weights recommendations based on how often users finish videos
- **Time Decay**: Recent watches have more influence than older ones

### 🔍 Advanced Scoring Algorithm
The system uses a multi-factor scoring model:
- **40% Channel Affinity**: Videos from channels you frequently watch
- **30% Category Match**: Content in your preferred categories
- **20% Tag Similarity**: Videos with tags matching your interests
- **10% Video Quality**: Engagement rates and popularity metrics

### 🌈 Diversity Prevention
To avoid filter bubbles:
- 70% highly personalized recommendations
- 30% diverse content from new channels/categories
- Automatic variety injection for exploratory discovery

### ⚡ Real-time Personalization
- Instant updates as you watch videos
- Dynamic preference adjustment
- Progressive profile building

## Architecture

### Core Components

#### 1. History-Based Recommendation Engine
**File**: `src/front-end/utils/historyBasedRecommendations.js`

Main functions:
- `getHistoryBasedRecommendations(userId, limit, excludeVideoIds)` - Primary recommendation engine
- `getHistoryBasedSimilarVideos(userId, currentVideoId, limit)` - "Up Next" feature
- `getRecommendationReason(video, userPreferences)` - Explains why videos were recommended

#### 2. Enhanced HomeFeed Component
**File**: `src/front-end/components/HomeFeed.jsx`

Integrations:
- Automatic history-based recommendations for "For You" feed
- Visual personalization indicators
- Recommendation reason display

#### 3. Enhanced RecommendationBar Component  
**File**: `src/front-end/components/RecomendationBar.jsx`

Features:
- Personalized "Up Next" suggestions
- Falls back to basic recommendations for logged-out users
- Uses watch history for contextual relevance

#### 4. Visual Styling
**File**: `src/styles/personalized-recommendations.css`

Provides:
- Personalized badges with gradient styling
- Sparkle animations for personalized content
- Mobile-responsive designs
- Tooltip explanations

## How It Works

### 1. Watch History Collection
Every time a user watches a video:
```javascript
// Tracked in watch_history table
{
  user_id: "uuid",
  video_id: "uuid", 
  watch_time: 245, // seconds
  completed: true,
  last_watched_at: "2025-12-27T..."
}
```

### 2. Profile Analysis
The system analyzes watch history to extract:
```javascript
{
  channelScores: { "TechChannel": 8.5, "CookingShow": 5.2 },
  categoryScores: { "Technology": 12.3, "Cooking": 7.8 },
  tagScores: { "javascript": 6.5, "recipes": 4.2 },
  avgCompletionRate: 0.75,
  topChannels: [...],
  topCategories: [...],
  topTags: [...]
}
```

### 3. Candidate Scoring
Each video receives a personalized score:
```javascript
score = 
  (channelAffinity × 40) +
  (categoryMatch × 30) +
  (tagSimilarity × 20) +
  (videoQuality × 10) +
  recencyBonus
```

### 4. Diversity Injection
Results are diversified:
- Top 70% = highest personalized scores
- Bottom 30% = diverse content from new sources
- Prevents echo chamber effect

## User Experience

### Visual Indicators

#### Personalized Badge
```css
✨ You watch TechChannel
```
- Purple gradient background
- Sparkle animation
- Shows recommendation reason on hover

#### Channel Affinity Indicator
```css
❤️ [Channel Name]
```
Displayed when you frequently watch a channel

#### Category Match Indicator
```css
🎯 [Category Name]
```
Shown for videos in your preferred categories

#### New Content Badge
```css
🆕 New video
```
Highlights recently uploaded content

### Feed Types

#### "For You" Feed
- 100% personalized using watch history
- Automatically adapts to your preferences
- Excludes already-watched videos

#### "Trending" Feed  
- Popular content across all users
- Less personalized, more discovery-focused

#### Cold Start (New Users)
- Popularity-based recommendations
- Diversity-first approach
- Gradually transitions to personalized once history builds

## Database Schema

### watch_history Table
```sql
CREATE TABLE watch_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  video_id UUID REFERENCES videos(id),
  watch_time INTEGER, -- seconds watched
  last_position INTEGER, -- last playback position
  completed BOOLEAN, -- fully watched?
  last_watched_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### video_categories Table
```sql
CREATE TABLE video_categories (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  category VARCHAR(50),
  confidence DECIMAL(3,2)
);
```

### video_tags Table
```sql
CREATE TABLE video_tags (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  tag VARCHAR(50)
);
```

## API Usage

### Get Personalized Recommendations
```javascript
import { getHistoryBasedRecommendations } from './utils/historyBasedRecommendations';

const recommendations = await getHistoryBasedRecommendations(
  userId,        // Current user ID
  20,            // Number of videos to return
  watchedIds     // Optional: Video IDs to exclude
);
```

### Get Similar Videos (Up Next)
```javascript
import { getHistoryBasedSimilarVideos } from './utils/historyBasedRecommendations';

const upNext = await getHistoryBasedSimilarVideos(
  userId,           // Current user ID
  currentVideoId,   // Currently watching video
  10                // Number of suggestions
);
```

### Get Recommendation Reason
```javascript
import { getRecommendationReason } from './utils/historyBasedRecommendations';

const reason = getRecommendationReason(video, userPreferences);
// Returns: "You watch TechChannel" or "Based on Technology videos you watched"
```

## Configuration

### Tunable Parameters

#### Time Decay (historyBasedRecommendations.js)
```javascript
const recencyMultiplier = Math.exp(-daysAgo / 30); // Adjust decay rate
```
- Default: 30-day half-life
- Lower = more emphasis on recent watches
- Higher = longer memory

#### Diversity Ratio
```javascript
const topCount = Math.floor(sortedVideos.length * 0.7); // 70% personalized
```
- Adjust 0.7 to change personalization/diversity balance
- Range: 0.5 (50/50) to 0.9 (90% personalized)

#### Scoring Weights
```javascript
// In calculatePersonalizedScore()
score += channelScore * 40;  // Channel weight
score += categoryScore * 30; // Category weight  
score += tagScore * 20;      // Tag weight
score += qualityScore * 0.1; // Quality weight
```

## Performance Optimizations

### Query Optimization
- Indexes on `user_id`, `video_id`, `last_watched_at`
- Limit watch history queries to last 100 entries
- Cache candidate videos (500 max)
- Debounced re-scoring on profile updates

### Caching Strategy
- React Query caches recommendations for 5 minutes
- Stale-while-revalidate pattern
- Aggressive prefetching for "Up Next" videos

### Async Processing
- Background profile analysis
- Non-blocking score calculations
- Progressive enhancement approach

## Privacy Considerations

### Data Storage
- Watch history stored in Supabase (server-side)
- User profiles computed on-demand
- No third-party tracking

### User Control
- Users can clear watch history
- Opt-out of personalization (falls back to trending)
- Transparent recommendation reasons

## Testing

### Manual Testing Steps

1. **Create New Account**
   - Verify cold start recommendations show popular videos
   - Confirm no personalized badges appear

2. **Watch Videos**
   - Watch 5-10 videos in specific categories
   - Check that personalized badges appear
   - Verify recommendation reasons match viewing patterns

3. **Test Channel Affinity**
   - Watch multiple videos from same channel
   - Confirm channel affinity indicators appear
   - Verify more recommendations from that channel

4. **Test Diversity**
   - After watching 20+ videos in one category
   - Confirm some recommendations from other categories appear
   - Verify "diversity badge" on exploratory suggestions

5. **Test "Up Next"**
   - Play a video
   - Check sidebar recommendations
   - Verify they relate to current video + your history

### Automated Testing

```javascript
// Example test case
describe('History-Based Recommendations', () => {
  it('should personalize based on watch history', async () => {
    const mockHistory = [
      { video: { channel_name: 'TechChannel', categories: ['Technology'] } },
      // ... more history
    ];
    
    const recommendations = await getHistoryBasedRecommendations(userId);
    
    expect(recommendations[0].personalizedScore).toBeGreaterThan(0);
    expect(recommendations.some(v => v.channel_name === 'TechChannel')).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

#### No Personalized Badges Showing
**Cause**: User not logged in or insufficient watch history
**Solution**: 
- Verify user authentication
- Watch at least 3-5 videos to build initial profile
- Check browser console for errors

#### Recommendations Not Updating
**Cause**: Cache not invalidating
**Solution**:
- Clear React Query cache
- Check `staleTime` configuration
- Verify database updates are saving

#### Too Many Similar Recommendations
**Cause**: Diversity ratio too high
**Solution**:
- Adjust `topCount` in `injectDiversity()`
- Increase diversity percentage (lower 0.7 value)
- Add more variation to watch history

#### Poor Recommendation Quality
**Cause**: Insufficient data or scoring weights imbalanced
**Solution**:
- Review scoring algorithm weights
- Check if categories/tags are properly assigned to videos
- Verify watch history is being recorded

## Future Enhancements

### Planned Features
1. **Collaborative Filtering**: Recommend based on similar users' preferences
2. **Explicit Feedback**: Like/dislike buttons to refine preferences
3. **Time-of-Day Patterns**: Learn when users prefer certain content
4. **Session Context**: Adapt recommendations within viewing sessions
5. **A/B Testing Framework**: Compare algorithm variations
6. **Real-time Learning**: Update preferences during active sessions
7. **Cross-Device Sync**: Unified profile across devices
8. **Content-Based Filtering**: Analyze video transcripts and metadata
9. **Trending Topics Integration**: Blend personalization with current events
10. **Playlist Recommendations**: Suggest curated playlists based on history

### Machine Learning Integration
Future versions could use ML models for:
- Deep learning embeddings for video similarity
- Neural collaborative filtering
- Sequence prediction for watch patterns
- Natural language processing for content understanding

## Best Practices

### For Developers

1. **Always Handle Null Cases**
   ```javascript
   if (!userId) return getColdStartRecommendations();
   ```

2. **Graceful Fallbacks**
   - Cold start for new users
   - Generic recommendations if history fetch fails
   - Basic similarity if personalization errors

3. **Performance Monitoring**
   - Log recommendation generation time
   - Track cache hit rates
   - Monitor database query performance

4. **User Experience**
   - Show loading states
   - Explain why content is recommended
   - Provide feedback mechanisms

### For Content Creators

1. **Proper Categorization**
   - Assign accurate categories to videos
   - Use relevant tags/keywords
   - Write descriptive titles/descriptions

2. **Engagement Optimization**
   - Create compelling thumbnails
   - Front-load interesting content
   - Encourage completion (watch time signals)

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/mm1618bu/MMartinezPortfolioRedo/issues)
- Review code documentation in source files
- Consult Supabase documentation for database queries

## License

This feature is part of the YouTube Clone project. See main project LICENSE for details.

---

**Last Updated**: December 27, 2025  
**Version**: 1.0.0  
**Author**: Portfolio Project
