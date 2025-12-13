# Quick Reference: Compression & Bandwidth Optimization

## 🚀 Quick Start

### Apply Database Migration
```bash
psql -h your-supabase-host -U postgres -d your-database \
  < database/migrations/add_video_compression_support.sql
```

### Add Settings Route
```javascript
import BandwidthSettings from './components/BandwidthSettings';
<Route path="/settings/bandwidth" element={<BandwidthSettings />} />
```

## 📚 Common Use Cases

### 1. Initialize Adaptive Streaming
```javascript
import ABRManager from './utils/abrManager';

const abrManager = new ABRManager(videoElement, userId);
await abrManager.initialize(videoId);

// Cleanup on unmount
abrManager.destroy(videoId);
```

### 2. Lazy Load Images
```javascript
import LazyImage from './components/LazyMedia';

<LazyImage
  src={imageUrl}
  alt="Description"
  type="thumbnail"
  placeholder={true}
  responsive={true}
/>
```

### 3. Get User Preferences
```javascript
import { getUserBandwidthPreferences } from './utils/compressionUtils';

const prefs = await getUserBandwidthPreferences(userId);
console.log(prefs.auto_quality); // true/false
console.log(prefs.preferred_quality); // '720p'
```

### 4. Track Bandwidth Usage
```javascript
import { logBandwidthUsage } from './utils/compressionUtils';

await logBandwidthUsage({
  userId,
  videoId,
  qualityLevel: '720p',
  bytesDownloaded: 50000000,
  durationSeconds: 300,
  averageSpeedKbps: 5000,
  bufferingEvents: 2,
  qualitySwitches: 1
});
```

### 5. Estimate Data Usage
```javascript
import { estimateDataUsage } from './utils/compressionUtils';

const usage = estimateDataUsage(60, '1080p'); // 60 minutes at 1080p
console.log(usage.formatted); // "3.6 GB"
console.log(usage.mb); // 3600
```

## 🎯 Quality Levels Reference

| Quality | Resolution | Bitrate | Hourly Data | Use Case |
|---------|-----------|---------|-------------|----------|
| 144p | 256×144 | 300 Kbps | 135 MB | Data saving |
| 240p | 426×240 | 500 Kbps | 225 MB | Slow connections |
| 360p | 640×360 | 1 Mbps | 450 MB | Mobile standard |
| 480p | 854×480 | 2.5 Mbps | 1.1 GB | SD quality |
| 720p | 1280×720 | 5 Mbps | 2.25 GB | HD (recommended) |
| 1080p | 1920×1080 | 8 Mbps | 3.6 GB | Full HD |
| 1440p | 2560×1440 | 16 Mbps | 7.2 GB | 2K quality |
| 2160p | 3840×2160 | 35 Mbps | 15.75 GB | 4K ultra |

## 🔧 ABR Configuration

### Strategies
```javascript
// Best quality, quick upgrades (default for fast connections)
abrManager.setStrategy('aggressive');

// Moderate approach (recommended)
abrManager.setStrategy('balanced');

// Stable, slow upgrades (best for unstable connections)
abrManager.setStrategy('conservative');
```

### Manual Control
```javascript
// Enable auto quality
abrManager.setAutoQuality(true);

// Manual quality selection
abrManager.setAutoQuality(false);
abrManager.setQuality('720p');

// Get current metrics
const metrics = abrManager.getMetrics();
// { currentQuality, currentSpeed, bufferingEvents, qualitySwitches, ... }
```

## 📊 Database Queries

### Get Quality Variants
```sql
SELECT * FROM video_quality_variants
WHERE video_id = 'your-video-id'
AND is_ready = true
ORDER BY bitrate_kbps DESC;
```

### Get User Statistics
```sql
SELECT 
  COUNT(*) as sessions,
  SUM(bytes_downloaded) as total_bytes,
  AVG(average_speed_kbps) as avg_speed,
  SUM(buffering_events) as buffering_count
FROM bandwidth_usage_logs
WHERE user_id = 'your-user-id'
AND session_date >= NOW() - INTERVAL '30 days';
```

### Calculate Optimal Quality
```sql
SELECT get_optimal_quality_for_bandwidth(5000, 'user-id');
-- Returns: '720p'
```

## 🎨 Component Props

### LazyImage
```typescript
{
  src: string;              // Image URL
  alt: string;              // Alt text
  type?: 'thumbnail' | 'avatar' | 'banner' | 'poster';
  width?: number;           // Width in pixels
  height?: number;          // Height in pixels
  className?: string;       // CSS class
  style?: CSSProperties;    // Inline styles
  placeholder?: boolean;    // Show blur placeholder (default: true)
  responsive?: boolean;     // Use responsive sources (default: true)
  onLoad?: (img) => void;   // Load callback
  onError?: (img) => void;  // Error callback
}
```

### LazyVideo
```typescript
{
  src: string;              // Video URL
  poster?: string;          // Poster image
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  autoPlay?: boolean;       // Auto play (default: false)
  muted?: boolean;          // Muted (default: false)
  loop?: boolean;           // Loop (default: false)
  controls?: boolean;       // Show controls (default: true)
  preload?: 'none' | 'metadata' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}
```

### VideoThumbnail
```typescript
{
  src: string;              // Thumbnail URL
  alt: string;              // Alt text
  duration?: number;        // Video duration in seconds
  watched?: boolean;        // Has been watched
  progress?: number;        // Watch progress (0-100)
  className?: string;
  onClick?: () => void;     // Click handler
}
```

## 🔍 Utility Functions

### Compression Utils
```javascript
// Get video quality variants
getVideoQualityVariants(videoId): Promise<QualityVariant[]>

// Get optimal quality for bandwidth
getOptimalQuality(bandwidthKbps, userId): Promise<string>

// Get/update user preferences
getUserBandwidthPreferences(userId): Promise<Preferences>
updateBandwidthPreferences(userId, prefs): Promise<Preferences>

// Log bandwidth usage
logBandwidthUsage(data): Promise<void>

// Calculate saved data
calculateBandwidthSaved(userId): Promise<{ total_bytes_saved, total_mb_saved, total_gb_saved }>

// Estimate data usage
estimateDataUsage(durationMinutes, quality): { mb, gb, formatted }

// Format helpers
formatBytes(bytes, decimals): string
formatBitrate(kbps): string
```

### Image Optimization
```javascript
// Get optimized image URL
getOptimizedImageUrl(url, options): string
// options: { width, height, quality, format, fit, blur, grayscale }

// Compress image client-side
compressImage(file, options): Promise<File>
// options: { maxWidth, maxHeight, quality, format }

// Create video thumbnail
createVideoThumbnail(videoFile, timeSeconds): Promise<File>

// Get image metadata
getImageMetadata(file): Promise<{ width, height, aspectRatio, size, type, name }>

// Preload images
preloadImage(src, options): Promise<Image>
preloadImages(urls): Promise<Image[]>
```

### Network Monitor
```javascript
const monitor = new NetworkMonitor();

// Add speed sample
monitor.addSample(bytesDownloaded, durationMs);

// Get average speed
monitor.getAverageSpeed(): number // Kbps

// Get recommended quality
monitor.getRecommendedQuality(userId): Promise<string>

// Check if can upgrade/downgrade
monitor.canUpgrade(currentQuality): boolean
monitor.shouldDowngrade(currentQuality): boolean

// Reset
monitor.reset();
```

## 🎨 CSS Classes

### Bandwidth Settings
- `.bandwidth-settings` - Main container
- `.stats-section` - Statistics section
- `.stat-card` - Individual stat card
- `.setting-section` - Setting row
- `.toggle-switch` - Toggle switch container
- `.quality-select` - Quality dropdown
- `.estimator-grid` - Data usage estimator

### Lazy Loading
- `.lazy-image-error` - Error state
- `.lazy-video-container` - Video wrapper
- `.video-thumbnail` - Thumbnail container
- `.lazy-loading` - Loading animation

## 🐛 Debugging

### Enable Logging
```javascript
// In abrManager.js, logs are already enabled
// Look for console.log messages:
// - "✅ ABR Manager initialized"
// - "⬆️ Upgrading quality to..."
// - "⬇️ Downgrading quality to..."
// - "⚠️ Critical buffer level..."
// - "⏸️ Buffering detected..."
```

### Check Quality Variants
```javascript
import { getVideoQualityVariants } from './utils/compressionUtils';

const variants = await getVideoQualityVariants(videoId);
console.log('Available qualities:', variants.map(v => v.quality_level));
```

### Monitor Network Speed
```javascript
// In VideoPlayer, networkSpeed state is updated every 2 seconds
// Display it in UI or log it
useEffect(() => {
  console.log('Current speed:', networkSpeed, 'Kbps');
}, [networkSpeed]);
```

## 📝 Environment Variables

No environment variables needed! Everything uses your existing Supabase configuration.

## 🔐 Security Notes

- All database tables have RLS policies
- Users can only access their own preferences and logs
- Quality variants are public for public videos
- Compression metadata is read-only for non-owners

## 📱 Browser Support

### Required Features
- ✅ ES6+ JavaScript
- ✅ Promises / async-await
- ✅ IntersectionObserver (lazy loading)
- ⚠️ Network Information API (optional, falls back gracefully)
- ✅ Canvas API (image compression)

### Codec Support
- H.264: All browsers
- H.265: Safari 11+, Edge 18+
- VP9: Chrome 29+, Firefox 28+, Edge 79+
- AV1: Chrome 70+, Firefox 67+, Edge 79+

## 🚨 Common Issues

### Quality doesn't switch
1. Check if quality variants exist in database
2. Verify ABR manager is initialized
3. Check browser console for errors

### Images don't lazy load
1. Ensure IntersectionObserver is supported
2. Check image URLs are valid
3. Verify data-src attribute is set

### High buffering
1. Lower max quality in settings
2. Enable data saver mode
3. Check network stability
4. Try conservative ABR strategy

### Settings not saving
1. Verify user is authenticated
2. Check RLS policies are enabled
3. Look for Supabase errors in console

## 📞 Support

- **Documentation**: See `COMPRESSION_OPTIMIZATION.md`
- **Database Schema**: `database/migrations/add_video_compression_support.sql`
- **Examples**: All utility files have JSDoc comments

---

**Version**: 1.0.0  
**Last Updated**: December 13, 2025  
**Status**: ✅ Production Ready
