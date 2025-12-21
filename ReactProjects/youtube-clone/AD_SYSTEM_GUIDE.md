# Ad Simulation Engine Documentation

## Overview
A complete ad simulation system for the YouTube clone with video ads, banner ads, companion ads, targeting, frequency control, and analytics tracking.

---

## Features

### ✅ **Ad Types Implemented**
1. **Video Ads (Pre-roll)** - Play before main video content
2. **Banner Ads** - Display ads in feed between video rows
3. **Companion Ads** - Sidebar ads next to video player
4. **Overlay Ads** - Future: Overlays on video content

### ✅ **Ad System Components**
- **Ad Targeting Engine** - Matches ads to video categories
- **Frequency Controller** - Prevents ad fatigue (max 10 ads/hour, 5min between ads)
- **Skip Controller** - Allows skipping after 5 seconds
- **Analytics Tracker** - Tracks impressions, clicks, completions, and revenue

### ✅ **Revenue Tracking**
- **Impressions**: $0.01-$0.03 per view
- **Clicks**: $0.25-$1.00 per click
- **Completions**: 50% bonus for fully watched video ads
- **Real-time Metrics**: CTR, RPM, total revenue

---

## File Structure

```
src/
├── front-end/
│   ├── components/
│   │   ├── BannerAd.jsx           # Banner ad component
│   │   ├── VideoAd.jsx            # Pre-roll video ad component
│   │   ├── CompanionAd.jsx        # Sidebar companion ad
│   │   ├── AdAnalyticsDashboard.jsx # Analytics dashboard
│   │   ├── VideoGrid.jsx          # Updated with banner ads
│   │   └── VideoPlayer.jsx        # Updated with pre-roll & companion ads
│   └── utils/
│       └── adSimulationEngine.js  # Core ad system engine
└── styles/
    └── main.css                    # Ad component styles (added)
```

---

## Usage Guide

### 1. **Video Ads (Pre-roll)**

**Location**: Video Player  
**Trigger**: 20% chance when video loads  
**Duration**: 15-20 seconds  
**Features**:
- Skippable after 5 seconds
- Shows countdown timer
- Click-to-advertiser link
- Progress bar
- Tracks impressions, clicks, completions

**Integration**:
```jsx
// In VideoPlayer.jsx
import { getPreRollAd } from '../utils/adSimulationEngine';
import VideoAd from './VideoAd.jsx';

// Load ad on video load
const ad = getPreRollAd(videoCategories);
setPreRollAd(ad);
setShowPreRollAd(true);

// Render
{showPreRollAd && preRollAd && (
  <VideoAd 
    ad={preRollAd}
    onComplete={() => setShowPreRollAd(false)}
    onSkip={() => setShowPreRollAd(false)}
  />
)}
```

### 2. **Banner Ads**

**Location**: Video Feed (VideoGrid)  
**Position**: After first 4 videos  
**Features**:
- Click-to-advertiser
- Closeable by user
- Responsive design
- Category-targeted

**Integration**:
```jsx
// In VideoGrid.jsx
import { getBannerAd } from '../utils/adSimulationEngine';
import BannerAd from './BannerAd.jsx';

// Load ad
const ad = getBannerAd([selectedCategory]);
setBannerAd(ad);

// Render between video rows
{showAd && bannerAd && (
  <BannerAd ad={bannerAd} onClose={() => setShowAd(false)} />
)}
```

### 3. **Companion Ads**

**Location**: Video Player Sidebar  
**Position**: Above "Up Next" recommendations  
**Features**:
- Always visible during video
- Click-to-advertiser
- Category-targeted
- 300x250 display ad

**Integration**:
```jsx
// In VideoPlayer.jsx
import { getCompanionAd } from '../utils/adSimulationEngine';
import CompanionAd from './CompanionAd.jsx';

// Load ad
const ad = getCompanionAd(videoCategories);
setCompanionAd(ad);

// Render in sidebar
{companionAd && <CompanionAd ad={companionAd} />}
```

### 4. **Analytics Dashboard**

**Location**: `/analytics/ads`  
**Access**: Navigate to the route to view metrics  
**Metrics**:
- Total Impressions
- Total Clicks
- Click-Through Rate (CTR)
- Total Revenue
- Revenue per 1000 Impressions (RPM)

**Integration**:
```jsx
// Already added to App.js routes
<Route path="/analytics/ads" element={<><TopNavBar /><AdAnalyticsDashboard /></>} />
```

---

## Ad Targeting System

### Category Matching
Ads are matched to video content categories:
- **Tech** → Smartphone ads, gadget ads
- **Gaming** → Game release ads, gaming hardware
- **Education** → Course platform ads, learning apps
- **Fitness** → Workout app ads, fitness equipment
- **Travel** → Vacation deals, travel booking
- **Food** → Cooking classes, recipe apps
- **Entertainment** → Streaming services, movies
- **General** → Catch-all for non-specific content

### Targeting Priority
1. **Exact Match**: Video has ad's target category
2. **Fallback**: Show general ads if no exact match
3. **Shuffle**: Randomize among eligible ads

---

## Frequency Control

### Rules
- **Maximum**: 10 ads per hour
- **Minimum Gap**: 5 minutes between ads
- **Session Tracking**: Resets on page reload

### Implementation
```javascript
// Check if ad should show
if (!adFrequencyController.shouldShowAd()) {
  return null; // Skip this ad
}

// Record ad shown
adFrequencyController.recordAdShown();
```

---

## Skip Controller

### Video Ad Skip Feature
- **Skip Delay**: 5 seconds (configurable)
- **Visual Countdown**: Shows remaining time
- **Skip Button**: Appears after delay
- **Tracking**: Skips count as interactions

### Implementation
```javascript
const skipController = new AdSkipController(5);
skipController.start();

// Check if skippable
if (skipController.canSkip()) {
  // Show skip button
}

// Get countdown
const remaining = skipController.getTimeUntilSkip(); // 5, 4, 3, 2, 1, 0
```

---

## Analytics Tracking

### Events Tracked
1. **Impressions**: Ad displayed to user
2. **Clicks**: User clicked on ad
3. **Completions**: Video ad watched to end
4. **Revenue**: Calculated based on interactions

### Data Storage
- **LocalStorage**: Last 100 events stored locally
- **Console Logging**: Real-time event logs
- **In Production**: Would POST to analytics server

### Revenue Model
```
Impression Value: $0.01 - $0.03
Click Value: $0.25 - $1.00
Completion Bonus: +50% of impression value

RPM (Revenue per Mille) = (Total Revenue / Impressions) * 1000
CTR (Click-Through Rate) = (Clicks / Impressions) * 100
```

---

## Mock Ad Database

### Current Ads (10 total)
- **3 Video Ads**: Smartphone, Game, Streaming Service
- **3 Banner Ads**: Education, Fitness, Travel
- **1 Overlay Ad**: Shopping/Subscribe
- **2 Companion Ads**: Audio Tech, Cooking Classes
- **1 General Ad**: (multi-purpose)

### Ad Structure
```javascript
{
  id: 'ad-video-1',
  type: AD_TYPES.VIDEO,
  title: 'New Smartphone Launch',
  description: 'Experience the future...',
  advertiser: 'TechCorp',
  duration: 15, // seconds (for video ads)
  videoUrl: 'https://...',  // for video ads
  imageUrl: 'https://...',  // for display ads
  clickUrl: 'https://...',
  categories: ['Technology'],
  impressionValue: 0.02,
  clickValue: 0.50
}
```

---

## API Reference

### Core Functions

#### `getPreRollAd(videoCategories)`
Get pre-roll video ad for video player.
- **Params**: `videoCategories` (array) - Categories of current video
- **Returns**: Ad object or null
- **Frequency Check**: Built-in

#### `getBannerAd(categories)`
Get banner ad for feed.
- **Params**: `categories` (array) - Filter categories
- **Returns**: Ad object or null
- **No Frequency Check**: Always returns ad

#### `getCompanionAd(videoCategories)`
Get companion ad for sidebar.
- **Params**: `videoCategories` (array) - Categories of current video
- **Returns**: Ad object or null
- **No Frequency Check**: Always returns ad

#### `adTargetingEngine.trackImpression(ad)`
Track ad impression.
- **Params**: `ad` (object) - The ad shown
- **Side Effects**: Updates analytics, logs to console

#### `adTargetingEngine.trackClick(ad)`
Track ad click.
- **Params**: `ad` (object) - The ad clicked
- **Side Effects**: Updates analytics, logs to console, adds revenue

#### `adTargetingEngine.trackCompletion(ad)`
Track video ad completion.
- **Params**: `ad` (object) - The video ad completed
- **Side Effects**: Updates analytics, adds completion bonus

#### `getAdAnalytics()`
Get current analytics summary.
- **Returns**: Object with impressions, clicks, ctr, revenue, rpm

#### `resetAdAnalytics()`
Reset all analytics (for testing).
- **Side Effects**: Clears counters and localStorage

---

## Testing Guide

### 1. **Test Video Ads**
```
1. Navigate to any video (/watch/:id)
2. Reload page multiple times (20% chance to show ad)
3. Wait 5 seconds for skip button
4. Click "Skip Ad" or let it complete
5. Main video should auto-play
```

### 2. **Test Banner Ads**
```
1. Go to video feed (home page)
2. Scroll down past first 4 videos
3. Banner ad should appear
4. Click ad to open advertiser link
5. Click close button (X) to dismiss
```

### 3. **Test Companion Ads**
```
1. Watch any video
2. Look at right sidebar
3. Companion ad should show above "Up Next"
4. Click to open advertiser link
```

### 4. **Test Analytics**
```
1. Navigate to /analytics/ads
2. View current metrics
3. Interact with ads (view, click)
4. Refresh analytics page to see updates
5. Click "Reset Analytics" to clear
```

### 5. **Test Frequency Control**
```
1. Watch multiple videos in quick succession
2. Pre-roll ads should respect 5-minute gap
3. After 10 ads, no more should show for an hour
4. Reload page to reset session
```

---

## Customization

### Adjust Ad Frequency
```javascript
// In adSimulationEngine.js
class AdFrequencyController {
  constructor() {
    this.maxAdsPerHour = 10;  // Change this
    this.minTimeBetweenAds = 5 * 60 * 1000;  // Change this (ms)
  }
}
```

### Adjust Skip Delay
```javascript
// In VideoAd.jsx
const skipControllerRef = useRef(new AdSkipController(5)); // Change 5 to desired seconds
```

### Change Pre-roll Probability
```javascript
// In VideoPlayer.jsx
if (Math.random() < 0.2) {  // Change 0.2 (20%) to desired probability
  const ad = getPreRollAd(categories);
  // ...
}
```

### Add New Ads
```javascript
// In adSimulationEngine.js, add to MOCK_ADS array
{
  id: 'ad-new-1',
  type: AD_TYPES.VIDEO, // or BANNER, COMPANION, OVERLAY
  title: 'Your Ad Title',
  description: 'Your ad description',
  advertiser: 'Your Company',
  duration: 15, // for video ads
  videoUrl: 'https://video-url.mp4', // for video ads
  imageUrl: 'https://image-url.jpg', // for display ads
  clickUrl: 'https://your-landing-page.com',
  categories: ['Technology', 'Gaming'], // targeting
  impressionValue: 0.02,
  clickValue: 0.50
}
```

---

## Production Considerations

### What This Demo Shows
✅ Ad serving logic  
✅ Targeting system  
✅ Frequency capping  
✅ Skip controls  
✅ Analytics tracking  
✅ Revenue calculations  

### What Production Needs
- **Real Ad Server**: Google Ad Manager, OpenX, etc.
- **Server-Side Logic**: Ad selection, bid management
- **Database**: Store ad campaigns, targeting rules
- **Authentication**: Verify ad impressions aren't fake
- **Payment Integration**: Handle advertiser billing
- **VAST/VPAID**: Industry standard video ad serving
- **Privacy Compliance**: GDPR, CCPA consent management
- **Ad Blockers**: Detection and mitigation strategies
- **Viewability Tracking**: Ensure ads actually visible
- **Brand Safety**: Content classification, blocklists

### Upgrading to Production
```javascript
// Replace mock ad fetch with real API call
const getPreRollAd = async (categories) => {
  const response = await fetch('/api/ads/video', {
    method: 'POST',
    body: JSON.stringify({
      placement: 'pre-roll',
      categories: categories,
      userId: currentUser?.id,
      pageUrl: window.location.href
    })
  });
  return response.json();
};

// Send analytics to real server
const trackImpression = async (ad) => {
  await fetch('/api/ads/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'impression',
      adId: ad.id,
      timestamp: Date.now(),
      userId: currentUser?.id,
      sessionId: getSessionId()
    })
  });
};
```

---

## Troubleshooting

### Ads Not Showing
1. **Check Frequency**: May have hit ad limit or timing restriction
2. **Check Console**: Look for ad loading logs
3. **Check Probability**: Video ads only show 20% of the time
4. **Clear localStorage**: Reset frequency tracking

### Analytics Not Updating
1. **Reload Dashboard**: Navigate away and back to `/analytics/ads`
2. **Check localStorage**: Open DevTools → Application → Local Storage
3. **Check Console**: Look for tracking event logs

### Video Ad Won't Skip
1. **Wait 5 Seconds**: Skip button appears after delay
2. **Check Console**: Look for skipController errors
3. **Try Different Browser**: May be video playback issue

### Companion Ad Overlapping
1. **Check Sidebar Width**: Should be 400px
2. **Reduce Browser Zoom**: Try 100% zoom
3. **Check CSS**: Companion ad should have margin-bottom

---

## Future Enhancements

### Phase 2 Features
- [ ] Mid-roll ads (during video at specific timestamps)
- [ ] Overlay ads on video
- [ ] Multiple ad pods (ad breaks)
- [ ] Rewarded ads (unlock content)
- [ ] Native ads (in-feed, styled like content)
- [ ] Programmatic bidding simulation
- [ ] A/B testing for ad creatives
- [ ] User ad preferences (topics to see/hide)
- [ ] Ad reporting (why this ad?)
- [ ] Advertiser dashboard (campaign management)

### Advanced Analytics
- [ ] Viewability tracking (% of ad visible)
- [ ] Engagement metrics (hover time, interaction)
- [ ] Conversion tracking (post-click actions)
- [ ] Attribution modeling (multi-touch)
- [ ] Audience insights (demographics, behavior)
- [ ] Heat maps (where users click)
- [ ] Video completion rate (VCR)
- [ ] Cost per action (CPA) tracking

---

## Resources

### Industry Standards
- **IAB**: Interactive Advertising Bureau - Ad standards
- **VAST**: Video Ad Serving Template - Video ad format
- **VPAID**: Video Player-Ad Interface Definition - Interactive video ads
- **OpenRTB**: Real-Time Bidding protocol

### Similar Systems
- **Google AdSense**: Display ad network
- **Google Ad Manager**: Complete ad serving platform
- **YouTube Ads**: Video ad platform (IMA SDK)
- **Facebook Audience Network**: Mobile ad platform

---

## Support

**Questions?** Check console logs for debugging info.  
**Issues?** Review this documentation and testing guide.  
**Enhancements?** See Future Enhancements section.

---

**Version**: 1.0.0  
**Last Updated**: December 21, 2025  
**Status**: ✅ Fully Functional
