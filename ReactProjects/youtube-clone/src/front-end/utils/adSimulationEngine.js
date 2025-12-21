/**
 * Ad Simulation Engine
 * Simulates a basic advertising system with different ad types and targeting
 */

/**
 * Ad Types
 */
export const AD_TYPES = {
  VIDEO: 'video',           // Pre-roll, mid-roll video ads
  BANNER: 'banner',         // Display banner ads
  OVERLAY: 'overlay',       // Overlay ads on video
  COMPANION: 'companion'    // Sidebar companion ads
};

/**
 * Ad Categories (for targeting)
 */
export const AD_CATEGORIES = {
  TECH: 'Technology',
  GAMING: 'Gaming',
  FASHION: 'Fashion',
  FOOD: 'Food & Cooking',
  TRAVEL: 'Travel',
  FITNESS: 'Fitness',
  EDUCATION: 'Education',
  ENTERTAINMENT: 'Entertainment',
  GENERAL: 'General'
};

/**
 * Mock Ad Database
 * In production, this would come from an ad server
 */
const MOCK_ADS = [
  // Video Ads
  {
    id: 'ad-video-1',
    type: AD_TYPES.VIDEO,
    title: 'New Smartphone Launch',
    description: 'Experience the future with our latest flagship phone',
    advertiser: 'TechCorp',
    duration: 15, // seconds
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    clickUrl: 'https://example.com/smartphone',
    categories: [AD_CATEGORIES.TECH],
    impressionValue: 0.02, // $0.02 per impression
    clickValue: 0.50 // $0.50 per click
  },
  {
    id: 'ad-video-2',
    type: AD_TYPES.VIDEO,
    title: 'Epic Game Release',
    description: 'Pre-order the most anticipated game of the year',
    advertiser: 'GameStudio',
    duration: 20,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    clickUrl: 'https://example.com/game',
    categories: [AD_CATEGORIES.GAMING, AD_CATEGORIES.ENTERTAINMENT],
    impressionValue: 0.03,
    clickValue: 0.75
  },
  {
    id: 'ad-video-3',
    type: AD_TYPES.VIDEO,
    title: 'Premium Streaming Service',
    description: 'Watch unlimited movies and shows - First month free!',
    advertiser: 'StreamFlix',
    duration: 15,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    clickUrl: 'https://example.com/stream',
    categories: [AD_CATEGORIES.ENTERTAINMENT],
    impressionValue: 0.025,
    clickValue: 1.00
  },

  // Banner Ads
  {
    id: 'ad-banner-1',
    type: AD_TYPES.BANNER,
    title: 'Online Course Sale',
    description: 'Learn new skills - 50% off all courses',
    advertiser: 'EduPlatform',
    imageUrl: 'https://via.placeholder.com/728x90/667eea/ffffff?text=50%25+OFF+All+Courses+-+Learn+Today',
    clickUrl: 'https://example.com/courses',
    categories: [AD_CATEGORIES.EDUCATION],
    impressionValue: 0.01,
    clickValue: 0.30
  },
  {
    id: 'ad-banner-2',
    type: AD_TYPES.BANNER,
    title: 'Fitness App',
    description: 'Transform your body in 30 days',
    advertiser: 'FitLife',
    imageUrl: 'https://via.placeholder.com/728x90/10b981/ffffff?text=Get+Fit+in+30+Days+-+Download+Now',
    clickUrl: 'https://example.com/fitness',
    categories: [AD_CATEGORIES.FITNESS],
    impressionValue: 0.015,
    clickValue: 0.40
  },
  {
    id: 'ad-banner-3',
    type: AD_TYPES.BANNER,
    title: 'Travel Deals',
    description: 'Explore the world with amazing deals',
    advertiser: 'TravelCo',
    imageUrl: 'https://via.placeholder.com/728x90/f97316/ffffff?text=Travel+Deals+-+Book+Your+Dream+Vacation',
    clickUrl: 'https://example.com/travel',
    categories: [AD_CATEGORIES.TRAVEL],
    impressionValue: 0.02,
    clickValue: 0.60
  },

  // Overlay Ads
  {
    id: 'ad-overlay-1',
    type: AD_TYPES.OVERLAY,
    title: 'Subscribe & Save',
    description: 'Get 20% off your first purchase',
    advertiser: 'ShopNow',
    imageUrl: 'https://via.placeholder.com/468x60/3b82f6/ffffff?text=Subscribe+%26+Save+20%25',
    clickUrl: 'https://example.com/shop',
    categories: [AD_CATEGORIES.GENERAL],
    impressionValue: 0.01,
    clickValue: 0.25
  },

  // Companion Ads
  {
    id: 'ad-companion-1',
    type: AD_TYPES.COMPANION,
    title: 'Premium Headphones',
    description: 'Experience crystal-clear audio',
    advertiser: 'AudioTech',
    imageUrl: 'https://via.placeholder.com/300x250/a855f7/ffffff?text=Premium+Audio+-+Shop+Now',
    clickUrl: 'https://example.com/headphones',
    categories: [AD_CATEGORIES.TECH],
    impressionValue: 0.015,
    clickValue: 0.45
  },
  {
    id: 'ad-companion-2',
    type: AD_TYPES.COMPANION,
    title: 'Cooking Classes',
    description: 'Become a master chef at home',
    advertiser: 'ChefAcademy',
    imageUrl: 'https://via.placeholder.com/300x250/ef4444/ffffff?text=Master+Chef+Classes+-+Enroll+Now',
    clickUrl: 'https://example.com/cooking',
    categories: [AD_CATEGORIES.FOOD],
    impressionValue: 0.012,
    clickValue: 0.35
  }
];

/**
 * Ad Targeting Engine
 * Selects appropriate ads based on video content and user preferences
 */
class AdTargetingEngine {
  constructor() {
    this.impressionCount = 0;
    this.clickCount = 0;
    this.revenue = 0;
  }

  /**
   * Get targeted ads based on video categories
   * @param {Array} videoCategories - Categories of the current video
   * @param {string} adType - Type of ad to fetch
   * @param {number} count - Number of ads to return
   * @returns {Array} - Array of targeted ads
   */
  getTargetedAds(videoCategories = [], adType = null, count = 1) {
    let eligibleAds = MOCK_ADS;

    // Filter by ad type if specified
    if (adType) {
      eligibleAds = eligibleAds.filter(ad => ad.type === adType);
    }

    // If video categories provided, prioritize matching ads
    if (videoCategories && videoCategories.length > 0) {
      const matchingAds = eligibleAds.filter(ad => 
        ad.categories.some(cat => videoCategories.includes(cat))
      );

      // Use matching ads if available, otherwise use all eligible ads
      if (matchingAds.length > 0) {
        eligibleAds = matchingAds;
      }
    }

    // Shuffle and return requested count
    const shuffled = this.shuffleArray([...eligibleAds]);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffle array for random ad selection
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Track ad impression
   */
  trackImpression(ad) {
    this.impressionCount++;
    this.revenue += ad.impressionValue;
    
    console.log(`💰 Ad Impression: ${ad.title} by ${ad.advertiser}`);
    console.log(`   Revenue: +$${ad.impressionValue.toFixed(3)}`);
    
    // In production, send to analytics server
    this.sendAnalytics({
      event: 'ad_impression',
      adId: ad.id,
      adType: ad.type,
      advertiser: ad.advertiser,
      value: ad.impressionValue
    });
  }

  /**
   * Track ad click
   */
  trackClick(ad) {
    this.clickCount++;
    this.revenue += ad.clickValue;
    
    console.log(`🎯 Ad Click: ${ad.title} by ${ad.advertiser}`);
    console.log(`   Revenue: +$${ad.clickValue.toFixed(2)}`);
    
    // In production, send to analytics server
    this.sendAnalytics({
      event: 'ad_click',
      adId: ad.id,
      adType: ad.type,
      advertiser: ad.advertiser,
      value: ad.clickValue
    });
  }

  /**
   * Track ad completion (for video ads)
   */
  trackCompletion(ad) {
    console.log(`✅ Ad Completed: ${ad.title}`);
    
    // Bonus revenue for completed video ads
    const completionBonus = ad.impressionValue * 0.5;
    this.revenue += completionBonus;
    
    this.sendAnalytics({
      event: 'ad_completion',
      adId: ad.id,
      adType: ad.type,
      advertiser: ad.advertiser,
      value: completionBonus
    });
  }

  /**
   * Get analytics summary
   */
  getAnalytics() {
    return {
      impressions: this.impressionCount,
      clicks: this.clickCount,
      ctr: this.impressionCount > 0 ? (this.clickCount / this.impressionCount * 100).toFixed(2) : 0,
      revenue: this.revenue.toFixed(2),
      rpm: this.impressionCount > 0 ? ((this.revenue / this.impressionCount) * 1000).toFixed(2) : 0
    };
  }

  /**
   * Send analytics (mock implementation)
   */
  sendAnalytics(data) {
    // In production, this would POST to analytics endpoint
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = 'ad_analytics';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ ...data, timestamp: Date.now() });
      
      // Keep only last 100 events
      if (existing.length > 100) {
        existing.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  /**
   * Reset analytics (for testing)
   */
  resetAnalytics() {
    this.impressionCount = 0;
    this.clickCount = 0;
    this.revenue = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('ad_analytics');
    }
  }
}

/**
 * Ad Frequency Controller
 * Controls how often ads are shown to avoid user fatigue
 */
class AdFrequencyController {
  constructor() {
    this.lastAdTime = null;
    this.adsShownInSession = 0;
    this.maxAdsPerHour = 10;
    this.minTimeBetweenAds = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if an ad should be shown
   */
  shouldShowAd() {
    const now = Date.now();

    // First ad of session always shows
    if (!this.lastAdTime) {
      return true;
    }

    // Check minimum time between ads
    const timeSinceLastAd = now - this.lastAdTime;
    if (timeSinceLastAd < this.minTimeBetweenAds) {
      return false;
    }

    // Check hourly limit (simple implementation)
    if (this.adsShownInSession >= this.maxAdsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Record that an ad was shown
   */
  recordAdShown() {
    this.lastAdTime = Date.now();
    this.adsShownInSession++;
  }

  /**
   * Reset session (called on page reload or after timeout)
   */
  resetSession() {
    this.lastAdTime = null;
    this.adsShownInSession = 0;
  }
}

/**
 * Ad Skip Controller
 * Manages skippable ads (e.g., skip after 5 seconds)
 */
export class AdSkipController {
  constructor(skipDelay = 5) {
    this.skipDelay = skipDelay; // seconds before skip is allowed
    this.startTime = null;
    this.skippable = false;
  }

  start() {
    this.startTime = Date.now();
    this.skippable = false;
  }

  update() {
    if (!this.startTime) return false;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.skippable = elapsed >= this.skipDelay;
    return this.skippable;
  }

  canSkip() {
    return this.skippable;
  }

  getTimeUntilSkip() {
    if (!this.startTime) return this.skipDelay;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = Math.max(0, this.skipDelay - elapsed);
    return Math.ceil(remaining);
  }
}

/**
 * Export singleton instances
 */
export const adTargetingEngine = new AdTargetingEngine();
export const adFrequencyController = new AdFrequencyController();

/**
 * Utility Functions
 */

/**
 * Get pre-roll video ad for video player
 */
export const getPreRollAd = (videoCategories = []) => {
  if (!adFrequencyController.shouldShowAd()) {
    return null;
  }

  const ads = adTargetingEngine.getTargetedAds(videoCategories, AD_TYPES.VIDEO, 1);
  if (ads.length > 0) {
    adFrequencyController.recordAdShown();
    return ads[0];
  }

  return null;
};

/**
 * Get banner ad for feed
 */
export const getBannerAd = (categories = []) => {
  const ads = adTargetingEngine.getTargetedAds(categories, AD_TYPES.BANNER, 1);
  return ads.length > 0 ? ads[0] : null;
};

/**
 * Get companion ad for sidebar
 */
export const getCompanionAd = (videoCategories = []) => {
  const ads = adTargetingEngine.getTargetedAds(videoCategories, AD_TYPES.COMPANION, 1);
  return ads.length > 0 ? ads[0] : null;
};

/**
 * Get overlay ad for video
 */
export const getOverlayAd = (videoCategories = []) => {
  const ads = adTargetingEngine.getTargetedAds(videoCategories, AD_TYPES.OVERLAY, 1);
  return ads.length > 0 ? ads[0] : null;
};

/**
 * Get ad analytics dashboard data
 */
export const getAdAnalytics = () => {
  return adTargetingEngine.getAnalytics();
};

/**
 * Reset ad analytics (for testing)
 */
export const resetAdAnalytics = () => {
  adTargetingEngine.resetAnalytics();
  adFrequencyController.resetSession();
};

export default adTargetingEngine;
