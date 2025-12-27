# Video Compression & Bandwidth Optimization

Comprehensive system for adaptive bitrate streaming, data saving, and bandwidth management.

## 🎯 Overview

This feature implements a complete video compression and bandwidth optimization system that includes:

- **Adaptive Bitrate Streaming (ABR)** - Automatic quality adjustment based on network conditions
- **Multiple Quality Levels** - Support for 144p to 4K (2160p) video quality
- **Bandwidth Monitoring** - Real-time network speed detection and tracking
- **Data Saver Mode** - Reduce data usage with lower quality settings
- **Image Optimization** - Lazy loading and responsive images
- **User Preferences** - Customizable quality and data usage settings

## 📊 Features

### 1. Adaptive Bitrate Streaming

The ABR system automatically adjusts video quality based on:
- Network speed measurements
- Buffer levels
- Buffering event frequency
- User preferences and limits

**Three ABR Strategies:**
- **Aggressive** - Quick upgrades, slow downgrades (best experience)
- **Balanced** - Moderate approach (default)
- **Conservative** - Slow upgrades, quick downgrades (stability)

### 2. Quality Levels

Eight quality levels with optimized bitrates:

| Quality | Resolution | Bitrate | Audio | Use Case |
|---------|-----------|---------|-------|----------|
| 144p | 256x144 | 300 Kbps | 64 Kbps | Mobile data, very slow connections |
| 240p | 426x240 | 500 Kbps | 64 Kbps | Slow connections, data saving |
| 360p | 640x360 | 1 Mbps | 96 Kbps | Standard mobile |
| 480p | 854x480 | 2.5 Mbps | 128 Kbps | SD quality |
| 720p | 1280x720 | 5 Mbps | 128 Kbps | HD, recommended |
| 1080p | 1920x1080 | 8 Mbps | 192 Kbps | Full HD |
| 1440p | 2560x1440 | 16 Mbps | 192 Kbps | 2K quality |
| 2160p | 3840x2160 | 35 Mbps | 256 Kbps | 4K quality |

### 3. Compression Codecs

Support for modern video codecs:
- **H.264** - Universal compatibility
- **H.265/HEVC** - 50% better compression
- **VP9** - Google's open codec
- **AV1** - 70% better compression (latest browsers)

### 4. Image Optimization

- **Lazy Loading** - Load images only when needed
- **Responsive Images** - Multiple sizes for different screens
- **Format Selection** - AVIF → WebP → JPEG fallback
- **Blur Placeholders** - Smooth loading experience
- **Progressive Loading** - Low quality → high quality

## 🗄️ Database Schema

### Tables Created

#### 1. `video_quality_variants`
Stores different quality versions of each video:
```sql
- id (UUID)
- video_id (UUID, foreign key)
- quality_level (VARCHAR) - '720p', '1080p', etc.
- resolution_width, resolution_height (INT)
- bitrate_kbps (INT)
- file_size_bytes (BIGINT)
- codec (VARCHAR) - 'h264', 'h265', 'vp9', 'av1'
- file_url (TEXT)
- is_ready (BOOLEAN)
- encoding_progress (INT) - 0-100
```

#### 2. `video_compression_metadata`
Tracks compression settings and metrics:
```sql
- id (UUID)
- video_id (UUID, foreign key)
- original_file_size_bytes (BIGINT)
- compressed_file_size_bytes (BIGINT)
- compression_ratio (DECIMAL)
- codec_used, preset (VARCHAR)
- processing_time_seconds (INT)
```

#### 3. `user_bandwidth_preferences`
User settings for quality and data usage:
```sql
- id (UUID)
- user_id (UUID, foreign key)
- auto_quality (BOOLEAN) - default true
- preferred_quality (VARCHAR) - default '720p'
- max_quality (VARCHAR) - default '1080p'
- data_saver_mode (BOOLEAN) - default false
- preload_next_video (BOOLEAN) - default true
- bandwidth_limit_mbps (DECIMAL) - optional cap
```

#### 4. `bandwidth_usage_logs`
Tracks actual bandwidth usage:
```sql
- id (UUID)
- user_id, video_id (UUID)
- quality_level (VARCHAR)
- bytes_downloaded (BIGINT)
- download_duration_seconds (INT)
- average_speed_kbps (INT)
- buffering_events (INT)
- quality_switches (INT)
- session_date (TIMESTAMP)
```

#### 5. `image_optimization_metadata`
Stores optimized image variants:
```sql
- id (UUID)
- original_image_url (TEXT)
- optimized_image_url (TEXT)
- image_type (VARCHAR) - 'thumbnail', 'banner', 'avatar'
- format (VARCHAR) - 'webp', 'avif', 'jpg'
- width, height (INT)
- file_size_bytes (INT)
- quality (INT) - 1-100
- compression_ratio (DECIMAL)
```

### Database Functions

#### `get_optimal_quality_for_bandwidth(p_bandwidth_kbps, p_user_id)`
Returns the optimal quality level based on:
- Available bandwidth
- User preferences (max quality, data saver mode)
- 25% buffer for smooth playback

#### `calculate_bandwidth_saved(p_user_id)`
Calculates total data saved by using lower qualities:
- Returns bytes, MB, and GB saved
- Estimates what would have been used at max quality

## 📁 File Structure

```
ReactProjects/youtube-clone/
├── database/migrations/
│   └── add_video_compression_support.sql
├── src/front-end/
│   ├── components/
│   │   ├── BandwidthSettings.jsx
│   │   ├── LazyMedia.jsx
│   │   └── VideoPlayer.jsx (updated)
│   └── utils/
│       ├── compressionUtils.js
│       ├── abrManager.js
│       └── imageOptimization.js
└── src/styles/
    └── main.css (updated)
```

## 🔧 Usage

### 1. Adaptive Bitrate Streaming

```javascript
import ABRManager from './utils/abrManager';

// Initialize ABR manager
const abrManager = new ABRManager(videoElement, userId);
await abrManager.initialize(videoId);

// Set strategy
abrManager.setStrategy('balanced'); // 'aggressive', 'balanced', 'conservative'

// Enable/disable auto quality
abrManager.setAutoQuality(true);

// Manual quality change
abrManager.setQuality('1080p');

// Get metrics
const metrics = abrManager.getMetrics();
console.log(metrics.currentSpeed); // Current bandwidth in Kbps
console.log(metrics.bufferingEvents); // Number of buffering events

// Cleanup
await abrManager.destroy(videoId);
```

### 2. Compression Utilities

```javascript
import { 
  getVideoQualityVariants,
  getOptimalQuality,
  estimateDataUsage,
  NetworkMonitor
} from './utils/compressionUtils';

// Get available qualities for video
const qualities = await getVideoQualityVariants(videoId);

// Get optimal quality for bandwidth
const optimal = await getOptimalQuality(5000, userId); // 5 Mbps

// Estimate data usage
const usage = estimateDataUsage(60, '720p'); // 60 minutes at 720p
console.log(usage.formatted); // "2.1 GB"

// Monitor network speed
const monitor = new NetworkMonitor();
monitor.addSample(bytesDownloaded, durationMs);
console.log(monitor.currentSpeed); // Average speed in Kbps
```

### 3. Lazy Loading Images

```javascript
import LazyImage, { 
  LazyVideo, 
  VideoThumbnail 
} from './components/LazyMedia';

// Lazy load image with blur placeholder
<LazyImage
  src={imageUrl}
  alt="Description"
  type="thumbnail"
  placeholder={true}
  responsive={true}
/>

// Lazy load video
<LazyVideo
  src={videoUrl}
  poster={thumbnailUrl}
  preload="metadata"
  controls
/>

// Video thumbnail with duration and progress
<VideoThumbnail
  src={thumbnailUrl}
  alt={title}
  duration={videoLength}
  progress={watchProgress}
  onClick={handleClick}
/>
```

### 4. Image Optimization

```javascript
import { 
  getOptimizedImageUrl,
  compressImage,
  createVideoThumbnail
} from './utils/imageOptimization';

// Get optimized image URL
const optimizedUrl = getOptimizedImageUrl(originalUrl, {
  width: 640,
  height: 360,
  quality: 80,
  format: 'webp'
});

// Compress image on client
const compressedFile = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8
});

// Create thumbnail from video
const thumbnail = await createVideoThumbnail(videoFile, 1); // At 1 second
```

### 5. Bandwidth Settings Component

```javascript
import BandwidthSettings from './components/BandwidthSettings';

// Add to your routing
<Route path="/settings/bandwidth" element={<BandwidthSettings />} />
```

The component provides:
- Usage statistics (data used, sessions, average speed)
- Auto quality toggle
- Preferred and maximum quality selection
- Data saver mode
- Preload next video setting
- Bandwidth limit input
- Data usage estimator
- Quality distribution chart
- Tips for saving data

## 🎨 VideoPlayer Integration

The VideoPlayer now includes:

1. **ABR Manager Integration**
   - Automatic quality switching
   - Network speed monitoring
   - Buffering event tracking

2. **Enhanced Quality Menu**
   - Shows current network speed
   - Displays all quality levels with bitrates
   - Shows buffering events count
   - Auto quality with live speed indicator

3. **Quality Change Events**
   - Logged to playback analytics
   - Tracks manual vs automatic changes
   - Records old and new quality levels

## 📈 Bandwidth Tracking

All bandwidth usage is automatically logged:
- Quality level used
- Bytes downloaded
- Session duration
- Average speed
- Buffering events
- Quality switches

View your stats in the Bandwidth Settings page:
- Total data used
- Data saved vs max quality
- Average connection speed
- Quality distribution
- Sessions count

## 🔐 Security

All tables have Row Level Security (RLS) policies:

- **Quality Variants**: Public read for public videos, owners can manage
- **Compression Metadata**: Public read, owners can insert
- **Bandwidth Preferences**: Users see only their own
- **Bandwidth Logs**: Users can only access their own logs
- **Image Metadata**: Public read, authenticated users can insert

## ⚡ Performance Optimizations

1. **Database Indexes** - All foreign keys and frequently queried columns
2. **Query Caching** - React Query with 5-minute stale time
3. **Lazy Loading** - Images and videos load only when needed
4. **Progressive Images** - Low quality placeholder → high quality
5. **Debounced Updates** - Network monitoring at 2-second intervals
6. **Materialized Views** - Pre-calculated trending videos (future)

## 🎯 Quality Selection Logic

The system selects quality based on:

1. **Network Speed**
   - Requires 125% of bitrate for current quality
   - Requires 150% of bitrate to upgrade
   - Upgrades after 5 seconds of stable speed
   - Downgrades after 2 seconds of poor speed

2. **Buffer Level**
   - Critical low buffer (< 2s) forces downgrade
   - Good buffer allows upgrade consideration

3. **User Preferences**
   - Respects maximum quality limit
   - Data saver mode uses lower qualities
   - Manual selection disables auto mode

4. **Buffering Events**
   - 3+ buffering events trigger downgrade
   - No buffering for 10s allows upgrade

## 📊 Data Savings

Example savings with data saver mode:

| Original Quality | Data Saver Quality | Savings |
|-----------------|-------------------|---------|
| 1080p (8 Mbps) | 480p (2.5 Mbps) | 68.75% |
| 720p (5 Mbps) | 360p (1 Mbps) | 80% |
| 480p (2.5 Mbps) | 240p (0.5 Mbps) | 80% |

**1 hour of video:**
- 4K (2160p): ~15.75 GB
- 1080p: ~3.6 GB
- 720p: ~2.25 GB
- 480p: ~1.125 GB
- 360p: ~450 MB
- 240p: ~225 MB

## 🔮 Future Enhancements

1. **Server-Side Encoding**
   - Automatic generation of quality variants
   - FFmpeg integration for compression
   - Background job processing

2. **Content-Aware Compression**
   - Higher quality for high-motion content
   - Lower bitrate for static content

3. **Predictive Quality Switching**
   - Machine learning for quality prediction
   - Historical bandwidth patterns

4. **Peer-to-Peer Delivery**
   - WebRTC for P2P streaming
   - Reduce server bandwidth costs

5. **Advanced Analytics**
   - Quality experience score
   - User satisfaction metrics
   - A/B testing for ABR strategies

## 🐛 Troubleshooting

### Video doesn't switch quality
- Check if quality variants exist in database
- Verify ABR manager is initialized
- Check browser console for errors
- Ensure user has bandwidth preferences

### Images not lazy loading
- Check if IntersectionObserver is supported
- Verify image URLs are valid
- Check network tab for loading

### High buffering events
- Network may be unstable
- Try lowering max quality
- Enable data saver mode
- Check for other network activity

### Quality menu not showing all levels
- Only shows available quality variants
- Upload/encode multiple qualities
- Check database for quality_variants records

## 📚 References

- [Adaptive Bitrate Streaming](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [HTML5 Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [WebP Image Format](https://developers.google.com/speed/webp)
- [AVIF Image Format](https://en.wikipedia.org/wiki/AVIF)

## ✅ Migration Checklist

1. Run database migration: `add_video_compression_support.sql`
2. Install new dependencies (if any)
3. Import ABRManager in VideoPlayer
4. Add BandwidthSettings route to App.js
5. Update existing video thumbnails to use LazyImage
6. Test quality switching on different network speeds
7. Verify RLS policies are working
8. Test bandwidth settings page
9. Check that usage is being logged

## 🎉 Success Metrics

After implementation, you should see:
- ✅ Automatic quality adaptation
- ✅ Reduced buffering events
- ✅ Lower data usage with data saver
- ✅ Faster page loads with lazy loading
- ✅ Bandwidth usage tracked and displayed
- ✅ User preferences saved and applied
- ✅ Smooth quality transitions
- ✅ Real-time network speed display

---

**Last Updated:** December 13, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
