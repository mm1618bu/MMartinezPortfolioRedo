# Personalized Recommendations - Quick Reference

## Overview
Watch history-based recommendation system that learns user preferences and suggests relevant videos.

## Key Files
- `src/front-end/utils/historyBasedRecommendations.js` - Core engine
- `src/front-end/components/HomeFeed.jsx` - Main feed integration
- `src/front-end/components/RecomendationBar.jsx` - "Up Next" suggestions
- `src/styles/personalized-recommendations.css` - Visual styling

## How It Works

### Scoring Algorithm
```
Personalized Score = 
  (Channel Affinity × 40%) +
  (Category Match × 30%) +
  (Tag Similarity × 20%) +
  (Video Quality × 10%) +
  Recency Bonus
```

### User Profile
Automatically learned from watch history:
- **Channels**: Which creators you watch most
- **Categories**: Your preferred content types
- **Tags**: Topics that interest you
- **Completion Rate**: How often you finish videos
- **Time Decay**: Recent activity weighted more

## Visual Indicators

### ✨ Personalized Badge
Purple gradient badge showing why recommended:
- "You watch [Channel Name]"
- "Based on [Category] videos you watched"
- "New video"
- "Popular"

### Recommendation Types

| Type | Description | Weight |
|------|-------------|--------|
| Channel Affinity | Videos from channels you watch | 40% |
| Category Match | Content in your preferred categories | 30% |
| Tag Similarity | Videos with matching tags | 20% |
| Video Quality | Popular, high-engagement content | 10% |

## API Usage

### Get Personalized Feed
```javascript
import { getHistoryBasedRecommendations } from './utils/historyBasedRecommendations';

const videos = await getHistoryBasedRecommendations(
  userId,      // Required
  20,          // Number to return (default: 20)
  excludeIds   // Optional: Videos to exclude
);
```

### Get Similar Videos
```javascript
import { getHistoryBasedSimilarVideos } from './utils/historyBasedRecommendations';

const similar = await getHistoryBasedSimilarVideos(
  userId,        // Required
  currentVideoId, // Currently watching
  10            // Number to return (default: 10)
);
```

### Get Recommendation Reason
```javascript
import { getRecommendationReason } from './utils/historyBasedRecommendations';

const reason = getRecommendationReason(video, userPreferences);
// Returns: "You watch TechChannel"
```

## Feed Types

### For You (Personalized)
- Uses full watch history
- Excludes already-watched videos
- 70% personalized + 30% diverse

### Trending
- Popular across all users
- Less personalized
- Discovery-focused

### Cold Start
- For new users without history
- Popularity-based
- Transitions to personalized as you watch

## Diversity Prevention
Prevents filter bubbles by:
- Limiting same-channel recommendations
- Injecting content from new categories
- Mixing popular with personalized
- Ensuring variety in suggestions

## User States

### New User (No History)
- Shows popular trending content
- No personalized badges
- Encourages exploration

### Growing Profile (3-10 videos watched)
- Beginning personalization
- Mix of trending + personalized
- Some badges appear

### Established Profile (10+ videos)
- Fully personalized feed
- Strong preference signals
- Personalized badges prominent

### Power User (50+ videos)
- Highly refined recommendations
- Strong channel/category preferences
- Diversity injection important

## Configuration

### Time Decay
```javascript
// In analyzeWatchHistory()
const recencyMultiplier = Math.exp(-daysAgo / 30); // 30-day decay
```
Adjust 30 to change how long preferences last.

### Diversity Ratio
```javascript
// In injectDiversity()
const topCount = Math.floor(sortedVideos.length * 0.7); // 70% personalized
```
Adjust 0.7 to balance personalization vs. discovery.

### Scoring Weights
```javascript
// In calculatePersonalizedScore()
score += channelScore * 40;  // Channel: 40%
score += categoryScore * 30; // Category: 30%
score += tagScore * 20;      // Tag: 20%
score += qualityScore * 0.1; // Quality: 10%
```

## Database Requirements

### Required Tables
- `watch_history` - User viewing history
- `video_categories` - Video categorization
- `video_tags` - Video tags/keywords

### Indexes
```sql
CREATE INDEX idx_watch_history_user ON watch_history(user_id, last_watched_at);
CREATE INDEX idx_video_categories_video ON video_categories(video_id);
CREATE INDEX idx_video_tags_video ON video_tags(video_id);
```

## Performance

### Query Optimization
- Watch history limited to last 100 entries
- Candidate videos capped at 500
- React Query caching (5 min stale time)

### Cache Strategy
- Shared video cache across components
- Stale-while-revalidate pattern
- Background refetching

## Troubleshooting

### No Personalized Content
**Check:**
- User is logged in
- Watch history exists (3+ videos)
- Categories/tags assigned to videos

### Poor Recommendations
**Check:**
- Scoring weights balanced
- Sufficient watch history diversity
- Videos have proper metadata

### Slow Performance
**Check:**
- Database indexes exist
- Query limits not too high
- React Query cache configured

## Testing

### Manual Test Flow
1. Create account
2. Watch 5 videos in specific category
3. Check home feed for personalized badge
4. Watch video from channel
5. Verify "Up Next" includes more from that channel
6. Check diversity in results

### Expected Behavior
- First 3 videos: No personalization
- 3-10 videos: Light personalization
- 10+ videos: Strong personalization
- Always some diversity (30%)

## Visual Examples

### Home Feed
```
┌─────────────────────────────┐
│ Video Thumbnail             │
│ ✨ You watch TechChannel    │ ← Personalized Badge
├─────────────────────────────┤
│ Video Title                 │
│ Channel Name                │
│ 100K views • 2 days ago     │
└─────────────────────────────┘
```

### Recommendation Bar (Up Next)
```
┌─────────────────────────────┐
│ Recommended videos          │
├─────────────────────────────┤
│ [Thumbnail] Video 1         │
│ ✨ Based on Technology      │
├─────────────────────────────┤
│ [Thumbnail] Video 2         │
│ ✨ You watch TechChannel    │
└─────────────────────────────┘
```

## CSS Classes

### Personalized Badge
```css
.personalized-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Purple gradient with sparkle animation */
}
```

### Channel Affinity
```css
.channel-affinity {
  background: rgba(102, 126, 234, 0.1);
  /* Light purple, shows ❤️ icon */
}
```

### Category Match
```css
.category-match {
  background: rgba(118, 75, 162, 0.1);
  /* Light purple, shows 🎯 icon */
}
```

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Mobile Considerations
- Badges truncated on small screens
- Touch-optimized spacing
- Simplified indicators < 480px
- Maintains core functionality

## Privacy
- Watch history stored server-side (Supabase)
- User profiles computed on-demand
- No third-party tracking
- Users can clear history anytime

## Future Enhancements
- [ ] Collaborative filtering (similar users)
- [ ] Explicit like/dislike feedback
- [ ] Time-of-day preferences
- [ ] Playlist recommendations
- [ ] Cross-device sync
- [ ] ML-based embeddings
- [ ] Real-time preference updates
- [ ] A/B testing framework

## Support Resources
- Full Documentation: `PERSONALIZED_RECOMMENDATIONS_GUIDE.md`
- Source Code: `src/front-end/utils/historyBasedRecommendations.js`
- Styling: `src/styles/personalized-recommendations.css`

---

**Quick Start**: Just watch videos! The system learns automatically and shows ✨ badges when content matches your interests.
