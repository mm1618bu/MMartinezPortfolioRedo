# 🚀 Live Creator Dashboard - Quick Reference

## Quick Access

Navigate to: **`/dashboard`**

Or click **"Creator Studio"** in the sidebar (📊 icon)

---

## At a Glance

### What It Does
- 📊 Shows real-time channel statistics
- 🔔 Displays live activity feed
- 📈 Provides analytics overview
- 🛡️ Manages content moderation
- ⚡ Auto-refreshes every 30 seconds

### Requirements
✅ Must be logged in
✅ Must have a channel created

---

## Dashboard Tabs

| Tab | Description | Updates |
|-----|-------------|---------|
| **Overview** | Main stats, quick actions | Every 30s |
| **Analytics** | Performance metrics, growth trends | Every 30s |
| **Activity Feed** | Real-time events | Instant |
| **Comments** | Flagged comments moderation | Every 15s |
| **Videos** | Flagged videos moderation | Every 15s |

---

## Key Stats

### Live Metrics
- 📹 **Total Videos** - All uploaded videos + monthly count
- 👁️ **Total Views** - Cumulative views across all content
- 💬 **Total Comments** - All comments on your videos
- 👍 **Total Likes** - Total engagement with like button
- 📺 **Subscriber Count** - Current subscriber total (live updating)

### Calculated Metrics
- **Avg Views per Video** = Total Views ÷ Total Videos
- **Engagement Rate** = (Total Likes ÷ Total Views) × 100
- **Monthly Growth** = Videos uploaded in last 30 days

---

## Real-Time Features

### Live Updates Via Supabase Realtime
1. **Video Changes** - Detects uploads, edits, deletions
2. **New Comments** - Alerts when comments are posted
3. **Subscriber Count** - Updates when subscriptions change

### Activity Types
- 🎥 New video uploaded
- 🎬 Video updated
- 💬 New comment received
- 📺 Subscriber count changed

---

## Moderation Tools

### Flagged Comments
**Actions:**
- ✅ Dismiss Flag - Keep comment, clear flag
- ❌ Remove Comment - Delete comment permanently

**Info Shown:**
- Comment text and author
- Who flagged it and reason
- Time posted and flagged

### Flagged Videos
**Actions:**
- ✅ Dismiss Flag - Keep video, clear flag
- ❌ Remove Video - Delete video permanently

**Info Shown:**
- Video title
- Who flagged it and reason
- Link to watch video

---

## Quick Actions

| Action | Goes To | Purpose |
|--------|---------|---------|
| 🎥 Upload Video | `/home` | Share new content |
| 📊 View Analytics | `/analytics/demographics` | Detailed insights |
| ⚙️ Channel Settings | `/channel/settings` | Customize channel |
| 📝 Recent Activity | Activity Feed Tab | See live events |

---

## Visual Indicators

### LIVE Badge
Red pulsing badge on stat cards indicating real-time data

### Status Bar
- 🔴 LIVE DASHBOARD - System is actively updating
- 👁️ Watching Now - Simulated concurrent viewers
- ⏰ Last Updated - Timestamp of last refresh

### Alert States
- 🟢 Green - Positive changes (growth)
- 🔴 Red - Needs attention (flagged content)
- ⚠️ Pulsing - Urgent action required

---

## Common Tasks

### Check Channel Performance
1. Go to **Overview** tab
2. Review 4 stat cards (videos, views, comments, likes)
3. Check monthly growth indicators

### Moderate Content
1. Look for red badges on **Comments** or **Videos** tabs
2. Click tab with flagged content
3. Review each item
4. Choose: Dismiss or Remove

### See Recent Activity
1. Click **Activity Feed** tab
2. Scroll through recent events
3. Events auto-update in real-time

### Analyze Growth
1. Go to **Analytics** tab
2. Review performance metrics
3. Click "View Full Analytics" for details

---

## Keyboard Shortcuts

Currently not implemented. Planned for future release.

---

## Performance

### Refresh Intervals
- **Stats**: 30 seconds
- **Flagged Content**: 15 seconds
- **Activity Feed**: Instant (realtime)

### Data Limits
- **Activity Feed**: Last 10 events
- **Stats Cache**: 10 seconds stale time
- **Auto-refresh**: Continuous while page is open

---

## Mobile Experience

### Responsive Breakpoints
- **Desktop**: Full layout (>768px)
- **Tablet**: Stacked layout (480-768px)
- **Mobile**: Single column (<480px)

### Touch Optimized
- 44px minimum touch targets
- Swipeable tabs
- Large action buttons

---

## Troubleshooting

### Dashboard Won't Load
1. Check if you're logged in
2. Verify you have a channel created
3. Check browser console for errors
4. Refresh the page

### Stats Not Updating
1. Wait 30 seconds for auto-refresh
2. Manually refresh browser
3. Check internet connection
4. Verify Supabase is online

### No Activity Showing
1. Activity appears when events happen
2. Try uploading a video or posting a comment
3. Check if realtime is enabled in Supabase
4. Look for errors in browser console

---

## API Endpoints Used

### Supabase Queries
- `getChannelDashboardStats()` - Fetches all metrics
- `getFlaggedCommentsForChannel()` - Gets flagged comments
- `getFlaggedVideosForChannel()` - Gets flagged videos
- `updateCommentFlagStatus()` - Updates flag status
- `updateVideoFlagStatus()` - Updates flag status
- `deleteComment()` - Removes comment

### Realtime Channels
- `channel_videos_{channelId}` - Video updates
- `channel_comments_{channelId}` - Comment updates
- `channel_updates_{channelId}` - Channel info updates

---

## Best Practices

### Regular Monitoring
- ✅ Check dashboard daily
- ✅ Review flagged content promptly
- ✅ Monitor growth trends weekly
- ✅ Respond to activity quickly

### Content Moderation
- ✅ Review flags within 24 hours
- ✅ Be fair and consistent
- ✅ Consider context before removing
- ✅ Keep records of actions taken

### Performance Tracking
- ✅ Note patterns in engagement
- ✅ Identify top-performing videos
- ✅ Track subscriber growth
- ✅ Monitor comment activity

---

## Next Steps

After mastering the dashboard:
1. Explore full analytics at `/analytics/demographics`
2. Customize channel at `/channel/settings`
3. Upload more content for better insights
4. Engage with your community
5. Track patterns and optimize content

---

## Links

- [Full Documentation](./LIVE_CREATOR_DASHBOARD_GUIDE.md)
- [Channel Guide](./CHANNEL_CREATION_GUIDE.md)
- [Analytics Guide](./ANALYTICS_GUIDE.md)
- [Main README](./README.md)

---

**Built for Creators, By Creators** 🎬

*Quick Reference v1.0 | December 2025*
