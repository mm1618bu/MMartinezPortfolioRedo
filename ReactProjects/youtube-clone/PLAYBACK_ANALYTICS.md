# Playback Analytics & Watch Time Tracking

## Overview
Comprehensive playback analytics system that tracks user watch time, engagement metrics, and viewing behavior for the YouTube clone.

## Features

### ✅ Session Tracking
- **Individual Sessions**: Each viewing session tracked with unique ID
- **Watch Time**: Accurate tracking of time spent watching
- **Completion Rate**: Percentage of video watched
- **Device & Browser**: Automatic detection of viewing environment
- **Playback Settings**: Tracks quality and speed preferences

### ✅ Granular Events
- **Play/Pause**: Track when users play or pause videos
- **Seek**: Monitor seeking behavior and patterns
- **Quality Changes**: Log quality adjustments
- **Speed Changes**: Track playback speed preferences
- **Video Ended**: Completion events

### ✅ Watch History
- **Resume Position**: Users can resume where they left off
- **Completion Status**: Mark videos as watched (90%+ completion)
- **Historical Data**: View all previously watched videos
- **Progress Tracking**: Visual progress bars on thumbnails
- **History Management**: Remove individual videos or clear all history

### ✅ Analytics for Creators
- **Total Sessions**: Count of viewing sessions
- **Total Watch Time**: Aggregate watch time across all viewers
- **Average Watch Time**: Mean watch duration per session
- **Average Completion**: Average percentage viewers complete
- **Time-based Reports**: Analytics for last 7/30/90 days

## Database Schema

### `playback_sessions` Table
Tracks individual viewing sessions with aggregate metrics.

```sql
- id (UUID, Primary Key)
- video_id (UUID, Foreign Key → videos.id)
- user_id (UUID, Foreign Key → auth.users.id) -- NULL for anonymous
- session_start (TIMESTAMP)
- session_end (TIMESTAMP)
- total_watch_time (INTEGER) -- seconds
- completion_percentage (DECIMAL) -- 0-100
- playback_speed (DECIMAL) -- 0.25-2.0
- quality_level (VARCHAR) -- auto, 1080p, 720p, etc.
- device_type (VARCHAR) -- mobile, tablet, desktop
- browser (VARCHAR) -- Chrome, Firefox, Safari, etc.
- country (VARCHAR) -- ISO country code
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `playback_events` Table
Stores granular playback events for detailed analysis.

```sql
- id (UUID, Primary Key)
- session_id (UUID, Foreign Key → playback_sessions.id)
- video_id (UUID, Foreign Key → videos.id)
- event_type (VARCHAR) -- play, pause, seek, ended, quality_change, speed_change
- timestamp_seconds (DECIMAL) -- position in video
- event_data (JSONB) -- additional event-specific data
- created_at (TIMESTAMP)
```

### `watch_history` Table
User viewing history with resume capability.

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → auth.users.id)
- video_id (UUID, Foreign Key → videos.id)
- last_position (DECIMAL) -- last watched position in seconds
- watch_time (INTEGER) -- total time watched in seconds
- completed (BOOLEAN) -- whether watched 90%+
- last_watched_at (TIMESTAMP)
- created_at (TIMESTAMP)
- UNIQUE(user_id, video_id)
```

### Indexes
- Video ID indexes for fast lookups
- User ID indexes for history queries
- Session ID indexes for event correlation
- Timestamp indexes for time-based queries
- Event type index for analytics

### RLS Policies
- Users can view their own sessions/history
- Video owners can view sessions for their videos
- Anyone can insert events (anonymous tracking)
- Users can manage their own watch history

## Components

### `PlaybackTracker` Class (`playbackAnalytics.js`)
Main tracking engine for video playback.

**Constructor:**
```javascript
const tracker = new PlaybackTracker(videoId, userId);
```

**Methods:**
- `startSession(videoDuration)` - Initialize tracking session
- `logEvent(type, timestamp, data)` - Log playback event
- `updateWatchTime(position)` - Update watch time calculation
- `updateSession()` - Sync session data to database
- `updateWatchHistory(position)` - Update user watch history
- `endSession(finalPosition)` - Finalize and close session
- `onPlay(position)` - Handle play event
- `onPause(position)` - Handle pause event
- `onSeek(from, to)` - Handle seek event
- `onEnded(position)` - Handle video end event
- `onQualityChange(position, quality)` - Handle quality change
- `onSpeedChange(position, speed)` - Handle speed change
- `destroy()` - Cleanup on unmount

**Automatic Features:**
- Periodic session updates every 10 seconds
- Smart watch time calculation (ignores large seeks)
- Automatic browser/device detection
- Completion percentage calculation

### `WatchHistory` Component
User interface for viewing and managing watch history.

**Features:**
- Display all watched videos with thumbnails
- Progress bars showing completion status
- Resume indicators with timestamp
- "Watched" badges for completed videos
- Remove individual videos
- Clear all history
- Responsive design

**Route:** `/history`

## Usage

### Integrating Tracking in VideoPlayer

The VideoPlayer component automatically initializes tracking:

```javascript
import { PlaybackTracker } from '../utils/playbackAnalytics';

// In component
const playbackTrackerRef = useRef(null);
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  const tracker = new PlaybackTracker(videoId, currentUser?.id);
  playbackTrackerRef.current = tracker;

  // Event listeners
  videoElement.addEventListener('play', handlePlay);
  videoElement.addEventListener('pause', handlePause);
  // ... more listeners

  return () => {
    tracker.endSession(currentTime);
    tracker.destroy();
  };
}, [video, videoId, currentUser]);
```

### Logging Custom Events

```javascript
// Log speed change
const handleSpeedChange = (speed) => {
  setPlaybackSpeed(speed);
  if (playbackTrackerRef.current && videoRef.current) {
    const currentTime = videoRef.current.currentTime;
    playbackTrackerRef.current.onSpeedChange(currentTime, speed);
  }
};
```

### Retrieving Analytics

```javascript
import { getVideoAnalytics } from '../utils/playbackAnalytics';

// Get analytics for a video (last 30 days)
const analytics = await getVideoAnalytics(videoId, 30);
console.log('Total sessions:', analytics.totalSessions);
console.log('Avg watch time:', analytics.avgWatchTime);
console.log('Avg completion:', analytics.avgCompletion);
```

### Managing Watch History

```javascript
import { 
  getUserWatchHistory, 
  removeFromWatchHistory, 
  clearWatchHistory,
  getResumePosition
} from '../utils/playbackAnalytics';

// Get user's watch history
const history = await getUserWatchHistory(userId, 50);

// Get resume position for a video
const resumePos = await getResumePosition(userId, videoId);
if (resumePos) {
  videoElement.currentTime = resumePos;
}

// Remove specific video
await removeFromWatchHistory(userId, videoId);

// Clear all history
await clearWatchHistory(userId);
```

## Event Types

### Play Event
```json
{
  "event_type": "play",
  "timestamp_seconds": 45.32,
  "event_data": {}
}
```

### Pause Event
```json
{
  "event_type": "pause",
  "timestamp_seconds": 120.50,
  "event_data": {}
}
```

### Seek Event
```json
{
  "event_type": "seek",
  "timestamp_seconds": 200.00,
  "event_data": {
    "from": 120.50,
    "to": 200.00,
    "delta": 79.50
  }
}
```

### Speed Change Event
```json
{
  "event_type": "speed_change",
  "timestamp_seconds": 45.20,
  "event_data": {
    "speed": 1.5
  }
}
```

### Quality Change Event
```json
{
  "event_type": "quality_change",
  "timestamp_seconds": 67.80,
  "event_data": {
    "quality": "1080p"
  }
}
```

### Video Ended Event
```json
{
  "event_type": "ended",
  "timestamp_seconds": 600.00,
  "event_data": {}
}
```

## Analytics Metrics

### Session Metrics
- **Session Duration**: `session_end - session_start`
- **Watch Time**: Total seconds of actual playback
- **Completion**: `(last_position / duration) * 100`
- **Engagement Rate**: `watch_time / session_duration`

### Aggregate Metrics
- **Total Sessions**: Count of all sessions
- **Total Watch Time**: Sum of all watch times
- **Average Watch Time**: Mean watch time per session
- **Average Completion**: Mean completion percentage
- **Retention Rate**: Percentage of users who complete videos

## Privacy & Security

### Anonymous Tracking
- Sessions can be tracked without user authentication
- `user_id` is NULL for anonymous sessions
- Still provides valuable aggregate data

### User Privacy
- Users can clear their watch history
- RLS policies protect user data
- Only aggregated data visible to creators
- No personal info stored (only IDs)

### Data Retention
- Consider implementing data retention policies
- Archive old sessions after 90/180 days
- Keep aggregated data, delete granular events

## Performance Considerations

### Throttling
- Session updates every 10 seconds (not on every timeupdate)
- Event logging is async (non-blocking)
- Watch time calculated client-side, synced periodically

### Database Optimization
- Indexes on frequently queried columns
- Batch inserts for events when possible
- Partition tables by date for large datasets
- Archive old data to separate tables

### Client-Side
- Tracker destroys cleanly on unmount
- No memory leaks from intervals
- Minimal impact on video playback performance

## Future Enhancements

- [ ] Heatmaps showing most/least watched segments
- [ ] A/B testing for different video lengths
- [ ] Engagement scoring algorithm
- [ ] Predictive analytics (drop-off prediction)
- [ ] Export analytics to CSV/Excel
- [ ] Real-time dashboard for creators
- [ ] Cohort analysis (viewer segments)
- [ ] Funnel analytics (discovery → view → complete)
- [ ] Recommendation engine based on watch patterns
- [ ] Notification triggers (e.g., low engagement alerts)

## Testing

### Manual Testing
- [ ] Play video and verify session starts
- [ ] Pause video and check pause event logs
- [ ] Seek in video and verify seek events
- [ ] Change playback speed and verify logging
- [ ] Change quality and verify logging
- [ ] Watch video to end and verify completion
- [ ] Close tab mid-video and verify session ends
- [ ] View watch history page
- [ ] Resume video from history
- [ ] Remove video from history
- [ ] Clear all history
- [ ] Test as anonymous user (no login)

### Analytics Verification
- [ ] Check session appears in database
- [ ] Verify events correlate to session
- [ ] Confirm watch time accuracy
- [ ] Validate completion percentage
- [ ] Test aggregate analytics queries

## Migration

Run the migration to add playback analytics:

```bash
# Connect to Supabase
psql "your-database-connection-string"

# Run migration
\i database/migrations/add_playback_analytics.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `add_playback_analytics.sql`
3. Execute the script

## API Reference

See `playbackAnalytics.js` for full API documentation.

**Key Exports:**
- `PlaybackTracker` - Main tracking class
- `getUserWatchHistory(userId, limit)` - Get user history
- `getResumePosition(userId, videoId)` - Get resume position
- `getVideoAnalytics(videoId, days)` - Get video analytics
- `clearWatchHistory(userId)` - Clear user history
- `removeFromWatchHistory(userId, videoId)` - Remove specific video

## Troubleshooting

### Events Not Logging
- Check console for errors
- Verify session started (sessionId not null)
- Ensure video element ref is valid
- Check RLS policies in Supabase

### Watch Time Inaccurate
- Large seeks (>5s) are excluded from watch time
- Only actual playback time is counted
- Paused time is not counted

### History Not Updating
- Requires authenticated user
- Verify user_id is correct
- Check upsert conflict clause
- Ensure RLS policies allow writes

## License

Part of the YouTube Clone project. See main project LICENSE.
