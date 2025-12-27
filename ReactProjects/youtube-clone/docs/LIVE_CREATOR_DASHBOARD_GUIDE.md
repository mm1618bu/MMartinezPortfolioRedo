# 📊 Live Creator Dashboard Guide

## Overview

The **Live Creator Dashboard** is a real-time analytics and content management interface for YouTube Clone creators. It provides instant insights into channel performance, real-time activity updates, and content moderation tools.

---

## 🌟 Key Features

### 1. **Real-Time Updates** 
- ⚡ **Auto-refresh** every 30 seconds for stats
- 🔄 **Live subscriptions** to database changes
- 📡 **Instant notifications** when content is updated
- 👁️ **Live viewer simulation** (in production, would show actual concurrent viewers)

### 2. **Comprehensive Analytics**
- **Total Videos**: Count with monthly growth indicator
- **Total Views**: With average per video
- **Total Comments**: Engagement across all content
- **Total Likes**: With engagement percentage
- **Subscriber Count**: Live updating from channel table
- **Performance Metrics**: CTR, engagement rate, view duration

### 3. **Activity Feed**
- Real-time feed of channel activity
- Shows new comments, video updates, uploads
- Displays subscriber changes
- Time-stamped with "just now", "5m ago", etc.

### 4. **Content Moderation**
- Review flagged comments
- Review flagged videos
- Dismiss or remove content
- See who flagged content and why

### 5. **Quick Actions**
- Upload Video
- View Analytics
- Channel Settings
- Recent Activity

---

## 🚀 Getting Started

### Access the Dashboard

Navigate to `/dashboard` while logged in as a channel owner:

```javascript
// Route in App.js
<Route path="/dashboard" element={<><TopNavBar /><LiveCreatorDashboard /></>} />
```

### Prerequisites

1. User must be authenticated
2. User must have a channel created
3. Channel must be linked to user_id in channels table

---

## 🔧 Technical Implementation

### Real-Time Subscriptions

The dashboard uses Supabase Realtime to subscribe to database changes:

```javascript
// Subscribe to video updates
videosSubscription.current = supabase
  .channel(`channel_videos_${userChannel.channel_id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'videos',
    filter: `channel_id=eq.${userChannel.channel_id}`
  }, (payload) => {
    // Handle updates
    queryClient.invalidateQueries(['dashboardStats']);
  })
  .subscribe();
```

### Auto-Refresh with React Query

```javascript
const { data: stats } = useQuery({
  queryKey: ['dashboardStats', userChannel?.channel_id],
  queryFn: () => getChannelDashboardStats(userChannel.channel_id),
  staleTime: 10000,        // 10 seconds
  refetchInterval: 30000,  // Auto-refresh every 30 seconds
});
```

### Activity Feed Updates

```javascript
const activity = {
  id: Date.now(),
  type: 'new_comment',
  message: `New comment from ${payload.new.user_name}`,
  timestamp: new Date().toISOString()
};
setRecentActivity(prev => [activity, ...prev].slice(0, 10));
```

---

## 📱 Dashboard Tabs

### 1. Overview Tab
- **Live Stats Grid**: Real-time metrics with LIVE badges
- **Moderation Alerts**: Urgent notifications for flagged content
- **Quick Actions**: Fast access to common tasks
- **Creator Tips**: Helpful guidance

### 2. Analytics Tab
- **Performance Overview**: CTR, engagement rate, view duration
- **Growth Trends**: Subscriber and view growth
- **Top Videos**: Most popular content
- **Link to Full Analytics**: Detailed demographics page

### 3. Activity Feed Tab
- **Real-time events**: Comments, uploads, updates
- **Color-coded items**: Different colors for event types
- **Slide-in animations**: New items animate in
- **Limited to 10 items**: Most recent activity only

### 4. Comments Tab (Moderation)
- **Flagged comments list**: Community-reported comments
- **Comment context**: See who wrote it and when
- **Reporter info**: See who flagged it and reason
- **Actions**: Dismiss flag or remove comment

### 5. Videos Tab (Moderation)
- **Flagged videos list**: Community-reported videos
- **Video details**: Title and link to watch
- **Actions**: Dismiss flag or remove video

---

## 🎨 UI Components

### Live Status Bar

```jsx
<div className="live-status-bar">
  <div className="live-indicator">
    <span className="live-dot"></span>
    <span className="live-text">LIVE DASHBOARD</span>
  </div>
  <div className="live-viewers">
    <span className="viewer-icon">👁️</span>
    <span className="viewer-count">{liveViewers} watching now</span>
  </div>
  <div className="last-updated">
    Last updated: {formatDate(new Date().toISOString())}
  </div>
</div>
```

### Stat Cards with LIVE Badge

```jsx
<div className="dashboard-stat-card live-card">
  <div className="stat-header">
    <div className="stat-icon">📹</div>
    <span className="stat-live-badge">LIVE</span>
  </div>
  <div className="stat-content">
    <div className="stat-value">{stats?.totalVideos || 0}</div>
    <div className="stat-label">Total Videos</div>
    <div className="stat-change positive">
      +{stats?.recentVideos || 0} this month
    </div>
  </div>
</div>
```

### Activity Item

```jsx
<div className={`activity-item ${activity.type}`}>
  <div className="activity-icon">💬</div>
  <div className="activity-content">
    <p className="activity-message">{activity.message}</p>
    <span className="activity-time">{formatDate(activity.timestamp)}</span>
  </div>
</div>
```

---

## 🎯 Helper Functions

### formatNumber
Converts large numbers to readable format:
- `1500` → `1.5K`
- `1500000` → `1.5M`

```javascript
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || 0;
};
```

### formatDate
Shows relative time for recent events:
- `< 1 min` → `"just now"`
- `< 1 hour` → `"25m ago"`
- `< 1 day` → `"5h ago"`
- `< 1 week` → `"3d ago"`
- `> 1 week` → `"12/25/2025"`

```javascript
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  // ... more logic
};
```

---

## 🔒 Security & Permissions

### Authentication Check
```javascript
useEffect(() => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate('/'); // Redirect to login
    return;
  }
  setCurrentUser(user);
}, [navigate]);
```

### Channel Ownership Verification
```javascript
const { data: channel } = await supabase
  .from('channels')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (!channel) {
  navigate('/channel/create'); // User doesn't have a channel
  return;
}
```

### RLS Policies
- Users can only view their own channel stats
- Flagged content is filtered by channel_id
- Comments/videos can only be deleted by owner

---

## 📊 Database Queries

### Get Dashboard Stats
Located in `supabase.js`:

```javascript
export const getChannelDashboardStats = async (channelId) => {
  // Get total videos
  const { data: videos } = await supabase
    .from('videos')
    .select('id, views, likes, dislikes, created_at')
    .eq('channel_id', channelId);

  // Calculate totals
  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;

  // Get flagged counts
  const { count: flaggedCommentsCount } = await supabase
    .from('flagged_comments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    totalVideos, totalViews, totalLikes,
    totalComments, flaggedComments, flaggedVideos,
    recentVideos // Videos uploaded in last 30 days
  };
};
```

---

## 🎭 Animations & Visual Effects

### Pulsing Live Indicator
```css
.live-dot {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
```

### Activity Item Slide-In
```css
.activity-item {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

### Card Hover Effects
```css
.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}
```

---

## 📱 Mobile Responsiveness

### Breakpoint: 768px
- Status bar items stack vertically
- Header actions become full-width
- Stats grid switches to single column
- Navigation tabs scroll horizontally

### Breakpoint: 480px
- Reduced font sizes
- Smaller action cards
- Simplified quick stats display
- Compact activity feed

```css
@media (max-width: 768px) {
  .live-status-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dashboard-action-button {
    flex: 1;
    justify-content: center;
  }
  
  .live-stats .dashboard-stats-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔔 Real-Time Event Types

### Video Events
- `INSERT`: New video uploaded
- `UPDATE`: Video metadata changed (title, description, views)
- `DELETE`: Video removed

### Comment Events
- `INSERT`: New comment posted on creator's video
- `UPDATE`: Comment edited
- `DELETE`: Comment removed

### Channel Events
- `UPDATE`: Subscriber count changed, channel info updated

---

## 🛠️ Customization Options

### Adjust Refresh Intervals

```javascript
// Faster updates (every 10 seconds)
refetchInterval: 10000

// Slower updates (every minute)
refetchInterval: 60000

// Disable auto-refresh
refetchInterval: false
```

### Change Activity Feed Limit

```javascript
// Show 20 items instead of 10
setRecentActivity(prev => [activity, ...prev].slice(0, 20));
```

### Modify Stale Time

```javascript
// Data stays fresh longer (1 minute)
staleTime: 60000

// Data expires quickly (5 seconds)
staleTime: 5000
```

---

## 🐛 Troubleshooting

### Dashboard not loading
1. Check if user is authenticated: `await supabase.auth.getUser()`
2. Verify channel exists: Check channels table for user_id
3. Check console for errors
4. Verify Supabase connection

### Stats not updating
1. Check `getChannelDashboardStats` function
2. Verify channel_id is correct
3. Check if videos table has data
4. Inspect React Query cache

### Real-time not working
1. Enable Realtime in Supabase dashboard
2. Check RLS policies allow reads
3. Verify channel subscription filter
4. Check browser console for subscription errors

### Activity feed empty
1. Trigger an event (upload video, post comment)
2. Check if subscriptions are active
3. Verify event types match filters
4. Check payload in console logs

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Charts and graphs for analytics
- [ ] Export data to CSV/PDF
- [ ] Email notifications for flagged content
- [ ] Bulk moderation actions
- [ ] Revenue/monetization tracking
- [ ] Video performance comparison
- [ ] Scheduled content calendar
- [ ] Team member management
- [ ] Advanced filtering and search
- [ ] Custom dashboard widgets

### Performance Optimizations
- [ ] Implement virtual scrolling for activity feed
- [ ] Add data pagination for large channels
- [ ] Cache frequently accessed stats
- [ ] Optimize database queries
- [ ] Add service worker for offline support

---

## 📚 Related Documentation

- [Creator Dashboard (Legacy)](./CREATOR_DASHBOARD_GUIDE.md)
- [Channel Creation Guide](./CHANNEL_CREATION_GUIDE.md)
- [Analytics System](./ANALYTICS_GUIDE.md)
- [Moderation System](./MODERATION_GUIDE.md)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Query](https://tanstack.com/query/latest)

---

## 🎉 Getting Help

If you encounter issues:

1. **Check the console** for error messages
2. **Verify authentication** status
3. **Inspect network requests** in DevTools
4. **Review Supabase logs** for API errors
5. **Check RLS policies** in Supabase dashboard

---

## 📝 Example Usage

### Navigating to Dashboard
```javascript
// From anywhere in the app
navigate('/dashboard');

// From sidebar
<Link to="/dashboard">Creator Studio</Link>
```

### Checking if User Can Access
```javascript
const hasChannel = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: channel } = await supabase
    .from('channels')
    .select('channel_id')
    .eq('user_id', user.id)
    .single();
  
  return !!channel;
};
```

### Manually Refresh Stats
```javascript
// In component
queryClient.invalidateQueries(['dashboardStats']);
```

---

**Built with ❤️ for YouTube Clone Creators**

*Last Updated: December 2025*
