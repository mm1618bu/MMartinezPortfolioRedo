# Creator Dashboard & Content Flagging System

## Overview
A comprehensive Creator Dashboard that allows content creators to manage their channel, review flagged content, and take moderation actions on comments and videos reported by the community.

## Features

### 📊 Dashboard Overview
- **Channel Statistics**: Total videos, views, comments, and likes
- **Recent Activity**: Videos uploaded in the last 30 days
- **Moderation Alerts**: Real-time notifications of flagged content
- **Quick Actions**: Direct links to review flagged content

### 💬 Flagged Comments Management
- View all comments flagged by community members
- See comment content, author, and video context
- Review flag reason and reporter information
- Actions:
  - **Dismiss Flag**: Keep comment, mark flag as resolved
  - **Remove Comment**: Delete the flagged comment

### 🎬 Flagged Videos Management
- View all videos flagged by community members
- See video title and flag reason
- Quick link to watch the flagged video
- Actions:
  - **Dismiss Flag**: Keep video, mark flag as resolved
  - **Remove Video**: Delete the flagged video

## Database Setup

### 1. Run the SQL Migration
Execute the SQL file to create the required tables:

```bash
# Connect to your Supabase project and run:
psql -h <your-host> -U postgres -d postgres -f create_flags_tables.sql
```

Or manually run the SQL in the Supabase SQL Editor:

```sql
-- See create_flags_tables.sql for the complete schema
```

### 2. Tables Created

#### `flagged_comments`
Stores information about flagged comments:
- `id`: Unique identifier (UUID)
- `comment_id`: Reference to the flagged comment
- `video_id`: Video where comment appears
- `flagged_by_user_id`: User who flagged it
- `flagged_by_username`: Username of reporter
- `reason`: Reason for flagging (spam, harassment, etc.)
- `status`: pending, reviewed, dismissed, or removed
- `created_at`: When the flag was created
- `reviewed_at`: When action was taken
- `reviewed_by`: Creator who reviewed it

#### `flagged_videos`
Stores information about flagged videos:
- `id`: Unique identifier (UUID)
- `video_id`: Reference to the flagged video
- `video_title`: Title of the video
- `flagged_by_user_id`: User who flagged it
- `flagged_by_username`: Username of reporter
- `channel_id`: Channel that owns the video
- `reason`: Reason for flagging
- `status`: pending, reviewed, dismissed, or removed
- `created_at`: When the flag was created
- `reviewed_at`: When action was taken
- `reviewed_by`: Creator who reviewed it

## API Functions

### Flagging Functions (added to supabase.js)

```javascript
// Flag a comment
flagComment(commentId, videoId, flaggedByUserId, flaggedByUsername, reason)

// Flag a video
flagVideo(videoId, videoTitle, channelId, flaggedByUserId, flaggedByUsername, reason)

// Get flagged comments for a channel
getFlaggedCommentsForChannel(channelId)

// Get flagged videos for a channel
getFlaggedVideosForChannel(channelId)

// Update comment flag status
updateCommentFlagStatus(flagId, status, reviewedBy)

// Update video flag status
updateVideoFlagStatus(flagId, status, reviewedBy)

// Delete a comment (moderation action)
deleteComment(commentId)

// Get comprehensive dashboard stats
getChannelDashboardStats(channelId)
```

## Usage

### Accessing the Dashboard
1. Channel owners will see a "📊 Dashboard" button on their channel page
2. Click the button to access the Creator Dashboard
3. Or navigate directly to `/dashboard` (requires authentication)

### Reviewing Flagged Content

#### Comments
1. Navigate to the "Flagged Comments" tab
2. Review each flagged comment with context
3. Choose an action:
   - **Dismiss**: The comment stays, flag is marked as reviewed
   - **Remove**: The comment is permanently deleted

#### Videos
1. Navigate to the "Flagged Videos" tab
2. Review each flagged video
3. Click "View Video" to watch the content
4. Choose an action:
   - **Dismiss**: The video stays, flag is marked as reviewed
   - **Remove**: The video is permanently deleted

### How Users Can Flag Content

To implement user-facing flagging (add to your comment/video components):

```javascript
import { flagComment, flagVideo } from '../utils/supabase';

// Flag a comment
const handleFlagComment = async (commentId, videoId) => {
  const reason = prompt('Why are you flagging this comment?');
  if (!reason) return;
  
  try {
    await flagComment(
      commentId,
      videoId,
      currentUser.id,
      currentUser.username,
      reason
    );
    alert('Comment flagged for review');
  } catch (error) {
    console.error('Error flagging comment:', error);
  }
};

// Flag a video
const handleFlagVideo = async (videoId, videoTitle, channelId) => {
  const reason = prompt('Why are you flagging this video?');
  if (!reason) return;
  
  try {
    await flagVideo(
      videoId,
      videoTitle,
      channelId,
      currentUser.id,
      currentUser.username,
      reason
    );
    alert('Video flagged for review');
  } catch (error) {
    console.error('Error flagging video:', error);
  }
};
```

## Security Considerations

1. **Row Level Security (RLS)**: All flagging tables have RLS enabled
2. **Authentication Required**: Only authenticated users can access the dashboard
3. **Channel Ownership**: Dashboard only shows content from user's own channel
4. **Action Logging**: All moderation actions are timestamped and attributed
5. **Soft Delete Recommended**: Consider implementing soft deletes to allow recovery

## Styling

The dashboard uses CSS custom properties for theming:
- `--bg-primary`: Main background color
- `--card-bg`: Card background
- `--text-primary`, `--text-secondary`, `--text-tertiary`: Text colors
- `--border-color`: Border colors
- `--primary`: Primary accent color (usually blue)
- `--hover-bg`: Hover state background

Supports both light and dark themes automatically.

## Performance

- **React Query**: 30-second cache for dashboard stats
- **Lazy Loading**: Flagged content only loaded when tabs are active
- **Optimistic Updates**: UI updates immediately on actions
- **Batch Queries**: Related data fetched in parallel

## Responsive Design

The dashboard is fully responsive:
- **Desktop**: 4-column grid for stats
- **Tablet**: 2-column grid
- **Mobile**: Single column, full-width buttons

## Future Enhancements

Consider adding:
1. **Flag Reasons Dropdown**: Predefined flag categories
2. **Bulk Actions**: Review multiple flags at once
3. **Flag History**: View previously reviewed flags
4. **Appeal System**: Let users appeal removed content
5. **Auto-Moderation**: AI-powered content filtering
6. **Email Notifications**: Alert creators of new flags
7. **Flagging Trends**: Analytics on what gets flagged most
8. **Community Guidelines**: Link to your content policy

## Troubleshooting

### Dashboard Not Loading
- Verify user is authenticated
- Check that user has a channel created
- Confirm database tables exist and RLS policies are correct

### Flags Not Appearing
- Check that flagged content belongs to the current user's channel
- Verify the status is 'pending' (not 'reviewed', 'dismissed', or 'removed')
- Check browser console for API errors

### Actions Not Working
- Verify user permissions in Supabase
- Check network tab for failed requests
- Ensure flag IDs are correct

## Integration Checklist

- [x] Database tables created (flagged_comments, flagged_videos)
- [x] API functions added to supabase.js
- [x] CreatorDashboard component created
- [x] Dashboard route added to App.js
- [x] Dashboard button added to Channel page
- [x] Styles added to main.css
- [ ] Add flag buttons to comment components
- [ ] Add flag button to video player
- [ ] Configure email notifications (optional)
- [ ] Add community guidelines page (optional)
- [ ] Implement analytics for flagging trends (optional)

## License
Part of the YouTube Clone project - use freely for your application.
