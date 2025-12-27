# 📊 Audience Demographics - Quick Reference

## 🚀 Quick Start

### View Your Analytics
```
Visit: /analytics/demographics
```

### Track a View
```javascript
import { collectDemographicData, trackVideoView } from './utils';

const demographics = collectDemographicData();
await trackVideoView(videoId, demographics);
```

## 📋 Key Functions

### demographicsUtils.js
```javascript
// Collect user's demographic data
collectDemographicData()
→ { device, browser, os, region, timeOfDay, ... }

// Aggregate raw view data
aggregateDemographics(viewsArray)
→ { byDevice: {...}, byBrowser: {...}, ... }

// Calculate percentages
calculatePercentages(aggregated)
→ { byDevice: [{label, count, percentage}, ...], ... }

// Generate insights
generateInsights(demographics)
→ [{category, text, icon}, ...]

// Export to CSV
exportToCSV(demographics)
→ "Category,Segment,Count,Percentage\n..."
```

### supabase.js
```javascript
// Track video view
trackVideoView(videoId, demographicData)
→ Promise<view_record>

// Get video analytics
getVideoAnalytics(videoId)
→ Promise<views_array>

// Get channel analytics
getChannelAnalytics(channelId)
→ Promise<views_array>

// Get time-filtered analytics
getAnalyticsByTimeRange(videoId, days)
→ Promise<views_array>
```

## 🎨 Components

### AudienceDemographics
```jsx
// Main dashboard component
<AudienceDemographics />

// Routes:
// /analytics/demographics - Your channel
// /analytics/demographics/video/:videoId - Single video
// /analytics/demographics/channel/:channelId - Any channel
```

### DemographicChart
```jsx
<DemographicChart
  data={[{label, count, percentage}, ...]}
  title="Chart Title"
  color="#1976d2"
  maxItems={5}
/>
```

## 📊 Data Structure

### Demographic Data
```javascript
{
  // Device Info
  device: 'Mobile',              // Mobile|Tablet|Desktop
  browser: 'Chrome',             // Browser name
  os: 'Android',                 // Operating system
  resolution: 'Full HD',         // Screen resolution category
  
  // Screen Dimensions
  screenWidth: 1920,             // Physical screen width
  screenHeight: 1080,            // Physical screen height
  viewportWidth: 1900,           // Browser viewport width
  viewportHeight: 950,           // Browser viewport height
  
  // Geographic
  timezone: 'America/New_York',  // IANA timezone
  locale: 'en-US',               // Language/locale
  region: 'Americas',            // Geographic region
  
  // Temporal
  timeOfDay: 'Evening',          // Morning|Afternoon|Evening|Night
  dayOfWeek: 'Monday',           // Day name
  
  // Meta
  timestamp: '2025-12-20T...',   // ISO 8601 timestamp
}
```

### Aggregated Data
```javascript
{
  totalViews: 12345,
  byDevice: [
    { label: 'Mobile', count: 7407, percentage: '60.0' },
    { label: 'Desktop', count: 3704, percentage: '30.0' }
  ],
  byBrowser: [...],
  byOS: [...],
  byRegion: [...],
  byTimeOfDay: [...],
  byDayOfWeek: [...],
  byResolution: [...]
}
```

## 🎯 Common Patterns

### Pattern 1: Track View
```javascript
// In VideoPlayer component
useEffect(() => {
  if (video && videoId) {
    const demographics = collectDemographicData();
    trackVideoView(videoId, demographics).catch(console.error);
  }
}, [video, videoId]);
```

### Pattern 2: Display Analytics
```javascript
function MyAnalytics({ videoId }) {
  const { data: analytics } = useQuery({
    queryKey: ['demographics', videoId],
    queryFn: () => getVideoAnalytics(videoId)
  });
  
  const demographics = useMemo(() => {
    const aggregated = aggregateDemographics(analytics);
    return calculatePercentages(aggregated);
  }, [analytics]);
  
  return <DemographicChart data={demographics.byDevice} />;
}
```

### Pattern 3: Export Data
```javascript
const handleExport = () => {
  const csv = exportToCSV(demographics);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'demographics.csv';
  a.click();
};
```

## 📱 Routes

| Route | Purpose |
|-------|---------|
| `/analytics/demographics` | Your channel analytics |
| `/analytics/demographics/video/:videoId` | Single video analytics |
| `/analytics/demographics/channel/:channelId` | Channel analytics |

## 🎨 Chart Colors

```javascript
const colors = {
  devices: '#1976d2',      // Blue
  browsers: '#4caf50',     // Green
  regions: '#ff9800',      // Orange
  timeSlots: '#9c27b0',    // Purple
  os: '#f44336',          // Red
  resolution: '#00bcd4',   // Cyan
  days: '#e91e63'         // Pink
};
```

## 🔍 Helper Functions

```javascript
// Device detection
getBrowserInfo()        → 'Chrome'
getDeviceType()         → 'Mobile'
getOperatingSystem()    → 'Android'
getScreenResolution()   → 'Full HD'

// Geographic
getTimezone()           → 'America/New_York'
getLocale()             → 'en-US'
getEstimatedRegion()    → 'Americas'

// Temporal
getTimeOfDay()          → 'Evening'
getDayOfWeek()          → 'Monday'
```

## 💾 Database

### Insert View
```sql
INSERT INTO video_views (
  video_id, user_id, device, browser, os,
  region, time_of_day, viewed_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
```

### Query Analytics
```sql
-- All views for a video
SELECT * FROM video_views WHERE video_id = $1;

-- Time-filtered views
SELECT * FROM video_views 
WHERE video_id = $1 
AND viewed_at >= $2;

-- Aggregated counts
SELECT device, COUNT(*) as count 
FROM video_views 
WHERE video_id = $1 
GROUP BY device;
```

## 🎯 Dashboard Tabs

- **Overview**: All categories at a glance
- **Devices**: Device, browser, OS, resolution
- **Geography**: Regional distribution
- **Time**: Time of day, day of week patterns

## 🔧 Configuration

### Time Ranges
```javascript
'7d'  → Last 7 days
'30d' → Last 30 days
'90d' → Last 90 days
'all' → All time
```

### Chart Limits
```javascript
maxItems: 5   // Default in overview
maxItems: 10  // Detailed views
maxItems: 7   // Day of week (all days)
```

## 📊 Key Metrics

```
┌─────────────────────────────────────┐
│ Total Views: 12,345                 │
│ Top Device: Mobile (60%)            │
│ Top Region: Americas (45%)          │
│ Peak Time: Evening (35%)            │
└─────────────────────────────────────┘
```

## 💡 Insights

```javascript
// Automated insights
{
  category: 'Device',
  text: '60% of viewers use Mobile',
  icon: '📱'
}
```

## 🐛 Debugging

### Check Data Collection
```javascript
console.log(collectDemographicData());
// Should show all demographic fields
```

### Verify Tracking
```javascript
trackVideoView(videoId, demographics)
  .then(result => console.log('Tracked:', result))
  .catch(err => console.error('Error:', err));
```

### Test Analytics Query
```javascript
getVideoAnalytics(videoId)
  .then(data => console.log('Analytics:', data))
  .catch(err => console.error('Error:', err));
```

## ⚡ Performance Tips

1. **Cache aggressively**: 5-10 minute staleTime
2. **Aggregate client-side**: Reduce database load
3. **Lazy load charts**: Only render visible tabs
4. **Debounce filters**: Wait for user to finish typing
5. **Index database**: Speed up queries

## 🎓 Examples

### Example 1: Basic Tracking
```javascript
// Automatic in VideoPlayer
const demographics = collectDemographicData();
await trackVideoView(videoId, demographics);
```

### Example 2: Custom Dashboard
```javascript
function CustomDashboard({ videoId }) {
  const { data } = useQuery({
    queryKey: ['demo', videoId],
    queryFn: () => getVideoAnalytics(videoId)
  });
  
  const processed = calculatePercentages(
    aggregateDemographics(data || [])
  );
  
  return (
    <div>
      <h2>Total: {processed.totalViews}</h2>
      <DemographicChart data={processed.byDevice} />
    </div>
  );
}
```

### Example 3: Export with Custom Name
```javascript
const exportWithName = (demographics, name) => {
  const csv = exportToCSV(demographics);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-demographics.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

## 🔗 Related Files

```
src/front-end/
├── components/
│   ├── AudienceDemographics.jsx
│   └── DemographicChart.jsx
└── utils/
    ├── demographicsUtils.js
    └── supabase.js (+ trackVideoView)
```

## ✅ Quick Checklist

- [ ] Database table created
- [ ] Tracking integrated in VideoPlayer
- [ ] Analytics queries working
- [ ] Dashboard renders correctly
- [ ] Charts display data
- [ ] Export functionality works
- [ ] Routes accessible

---

**Need more details?** See [AUDIENCE_DEMOGRAPHICS.md](./AUDIENCE_DEMOGRAPHICS.md)
