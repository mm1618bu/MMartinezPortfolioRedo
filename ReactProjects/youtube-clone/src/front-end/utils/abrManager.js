/**
 * Adaptive Bitrate Streaming (ABR) Manager
 * Handles automatic quality switching based on network conditions
 */

import { 
  NetworkMonitor, 
  QUALITY_LEVELS, 
  getVideoQualityVariants,
  getOptimalQuality,
  getUserBandwidthPreferences,
  logBandwidthUsage
} from './compressionUtils';

/**
 * ABR Strategy types
 */
export const ABR_STRATEGIES = {
  AGGRESSIVE: 'aggressive', // Quick quality upgrades, slow downgrades
  BALANCED: 'balanced',     // Moderate approach (default)
  CONSERVATIVE: 'conservative' // Slow upgrades, quick downgrades
};

/**
 * Adaptive Bitrate Streaming Manager
 */
export class ABRManager {
  constructor(videoElement, userId = null) {
    this.videoElement = videoElement;
    this.userId = userId;
    this.networkMonitor = new NetworkMonitor();
    this.strategy = ABR_STRATEGIES.BALANCED;
    
    // State
    this.currentQuality = '720p';
    this.availableQualities = [];
    this.isAutoQuality = true;
    this.userPreferences = null;
    
    // Metrics
    this.bufferingEvents = 0;
    this.qualitySwitches = 0;
    this.bytesDownloaded = 0;
    this.sessionStartTime = Date.now();
    this.lastQualitySwitch = Date.now();
    
    // Thresholds
    this.upgradeDelayMs = 5000;  // Wait 5s before upgrading
    this.downgradeDelayMs = 2000; // Wait 2s before downgrading
    this.minSwitchInterval = 3000; // Don't switch more often than every 3s
    
    // Monitoring intervals
    this.monitoringInterval = null;
    this.bufferCheckInterval = null;
    
    this.initialized = false;
  }

  /**
   * Initialize the ABR manager
   */
  async initialize(videoId) {
    try {
      // Load user preferences
      if (this.userId) {
        this.userPreferences = await getUserBandwidthPreferences(this.userId);
        if (this.userPreferences) {
          this.isAutoQuality = this.userPreferences.auto_quality;
          this.currentQuality = this.userPreferences.preferred_quality || '720p';
        }
      }

      // Load available quality variants
      this.availableQualities = await getVideoQualityVariants(videoId);
      
      if (this.availableQualities.length === 0) {
        console.warn('No quality variants available, ABR disabled');
        return;
      }

      // Sort qualities by bitrate
      this.availableQualities.sort((a, b) => b.bitrate_kbps - a.bitrate_kbps);

      // Set initial quality
      if (this.isAutoQuality) {
        await this.detectAndSetOptimalQuality();
      } else {
        this.setQuality(this.currentQuality);
      }

      // Start monitoring
      this.startMonitoring();
      
      this.initialized = true;
      console.log('✅ ABR Manager initialized', {
        qualities: this.availableQualities.length,
        currentQuality: this.currentQuality,
        autoQuality: this.isAutoQuality
      });
    } catch (error) {
      console.error('Error initializing ABR Manager:', error);
    }
  }

  /**
   * Detect network speed and set optimal quality
   */
  async detectAndSetOptimalQuality() {
    try {
      // Use Network Information API if available
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection && connection.downlink) {
          const bandwidthKbps = connection.downlink * 1000; // Mbps to Kbps
          this.networkMonitor.addSample(bandwidthKbps * 125, 1000); // Convert to bytes
        }
      }

      // Get optimal quality from server function
      const optimalQuality = await getOptimalQuality(
        this.networkMonitor.currentSpeed || 5000,
        this.userId
      );

      this.setQuality(optimalQuality);
    } catch (error) {
      console.error('Error detecting optimal quality:', error);
      this.setQuality('480p'); // Safe default
    }
  }

  /**
   * Set video quality
   */
  setQuality(qualityLevel) {
    const qualityVariant = this.availableQualities.find(
      q => q.quality_level === qualityLevel
    );

    if (!qualityVariant) {
      console.warn(`Quality ${qualityLevel} not available`);
      return false;
    }

    const wasPlaying = !this.videoElement.paused;
    const currentTime = this.videoElement.currentTime;

    // Switch video source
    this.videoElement.src = qualityVariant.file_url;
    this.videoElement.currentTime = currentTime;

    if (wasPlaying) {
      this.videoElement.play().catch(e => {
        console.error('Error resuming playback:', e);
      });
    }

    const oldQuality = this.currentQuality;
    this.currentQuality = qualityLevel;

    if (oldQuality !== qualityLevel) {
      this.qualitySwitches++;
      this.lastQualitySwitch = Date.now();
      
      console.log(`📊 Quality switched: ${oldQuality} → ${qualityLevel}`);
      
      // Dispatch custom event
      this.videoElement.dispatchEvent(new CustomEvent('qualitychange', {
        detail: {
          oldQuality,
          newQuality: qualityLevel,
          auto: this.isAutoQuality
        }
      }));
    }

    return true;
  }

  /**
   * Start monitoring network and buffer
   */
  startMonitoring() {
    // Monitor network speed
    this.monitoringInterval = setInterval(() => {
      this.checkNetworkConditions();
    }, 2000);

    // Monitor buffer levels
    this.bufferCheckInterval = setInterval(() => {
      this.checkBufferLevel();
    }, 1000);

    // Track download progress
    this.videoElement.addEventListener('progress', this.handleProgress.bind(this));
    this.videoElement.addEventListener('waiting', this.handleBuffering.bind(this));
    this.videoElement.addEventListener('canplay', this.handleCanPlay.bind(this));
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.bufferCheckInterval) {
      clearInterval(this.bufferCheckInterval);
      this.bufferCheckInterval = null;
    }

    this.videoElement.removeEventListener('progress', this.handleProgress.bind(this));
    this.videoElement.removeEventListener('waiting', this.handleBuffering.bind(this));
    this.videoElement.removeEventListener('canplay', this.handleCanPlay.bind(this));
  }

  /**
   * Check network conditions and adjust quality
   */
  async checkNetworkConditions() {
    if (!this.isAutoQuality || !this.initialized) return;

    // Don't switch too frequently
    if (Date.now() - this.lastQualitySwitch < this.minSwitchInterval) {
      return;
    }

    const currentSpeed = this.networkMonitor.currentSpeed;
    if (currentSpeed === 0) return; // Not enough data yet

    // Check if we should upgrade
    if (this.networkMonitor.canUpgrade(this.currentQuality)) {
      if (this.shouldUpgrade()) {
        const nextQuality = this.getNextHigherQuality();
        if (nextQuality) {
          console.log(`⬆️ Upgrading quality to ${nextQuality}`);
          this.setQuality(nextQuality);
        }
      }
    }

    // Check if we should downgrade
    if (this.networkMonitor.shouldDowngrade(this.currentQuality)) {
      if (this.shouldDowngrade()) {
        const lowerQuality = this.getNextLowerQuality();
        if (lowerQuality) {
          console.log(`⬇️ Downgrading quality to ${lowerQuality}`);
          this.setQuality(lowerQuality);
        }
      }
    }
  }

  /**
   * Check buffer level
   */
  checkBufferLevel() {
    if (!this.videoElement.buffered.length) return;

    const currentTime = this.videoElement.currentTime;
    const buffered = this.videoElement.buffered;

    // Find buffer end
    let bufferEnd = 0;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
        bufferEnd = buffered.end(i);
        break;
      }
    }

    const bufferLength = bufferEnd - currentTime;

    // Critical low buffer - force downgrade
    if (bufferLength < 2 && this.isAutoQuality) {
      const lowerQuality = this.getNextLowerQuality();
      if (lowerQuality) {
        console.warn('⚠️ Critical buffer level, forcing downgrade');
        this.setQuality(lowerQuality);
      }
    }
  }

  /**
   * Handle download progress
   */
  handleProgress(event) {
    if (!this.videoElement.buffered.length) return;

    const buffered = this.videoElement.buffered;
    const duration = this.videoElement.duration;
    
    if (!duration || isNaN(duration)) return;

    // Calculate total buffered
    let totalBuffered = 0;
    for (let i = 0; i < buffered.length; i++) {
      totalBuffered += buffered.end(i) - buffered.start(i);
    }

    const bufferedPercent = (totalBuffered / duration) * 100;
    
    // Estimate bytes downloaded based on quality
    const quality = QUALITY_LEVELS[this.currentQuality];
    if (quality) {
      const estimatedBytes = (quality.bitrate * 1000 / 8) * totalBuffered;
      this.bytesDownloaded = estimatedBytes;

      // Update network monitor with sample
      const timeSinceStart = Date.now() - this.sessionStartTime;
      if (timeSinceStart > 0) {
        this.networkMonitor.addSample(estimatedBytes, timeSinceStart);
      }
    }
  }

  /**
   * Handle buffering event
   */
  handleBuffering() {
    this.bufferingEvents++;
    console.warn('⏸️ Buffering detected, count:', this.bufferingEvents);

    // If buffering frequently, downgrade quality
    if (this.bufferingEvents > 3 && this.isAutoQuality) {
      const lowerQuality = this.getNextLowerQuality();
      if (lowerQuality) {
        console.warn('Multiple buffering events, downgrading quality');
        this.setQuality(lowerQuality);
      }
    }
  }

  /**
   * Handle can play event
   */
  handleCanPlay() {
    // Video can play, reset buffering counter if it was low
    if (this.bufferingEvents < 2) {
      this.bufferingEvents = 0;
    }
  }

  /**
   * Check if should upgrade quality
   */
  shouldUpgrade() {
    switch (this.strategy) {
      case ABR_STRATEGIES.AGGRESSIVE:
        return Date.now() - this.lastQualitySwitch > 3000 && this.bufferingEvents === 0;
      
      case ABR_STRATEGIES.BALANCED:
        return Date.now() - this.lastQualitySwitch > this.upgradeDelayMs && this.bufferingEvents < 2;
      
      case ABR_STRATEGIES.CONSERVATIVE:
        return Date.now() - this.lastQualitySwitch > 10000 && this.bufferingEvents === 0;
      
      default:
        return false;
    }
  }

  /**
   * Check if should downgrade quality
   */
  shouldDowngrade() {
    switch (this.strategy) {
      case ABR_STRATEGIES.AGGRESSIVE:
        return Date.now() - this.lastQualitySwitch > 5000 || this.bufferingEvents > 1;
      
      case ABR_STRATEGIES.BALANCED:
        return Date.now() - this.lastQualitySwitch > this.downgradeDelayMs || this.bufferingEvents > 2;
      
      case ABR_STRATEGIES.CONSERVATIVE:
        return Date.now() - this.lastQualitySwitch > 1000 || this.bufferingEvents > 0;
      
      default:
        return false;
    }
  }

  /**
   * Get next higher quality
   */
  getNextHigherQuality() {
    const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    const currentIndex = qualityOrder.indexOf(this.currentQuality);
    
    if (currentIndex === -1 || currentIndex === qualityOrder.length - 1) {
      return null;
    }

    // Check max quality preference
    const maxQuality = this.userPreferences?.max_quality || '1080p';
    const maxIndex = qualityOrder.indexOf(maxQuality);

    for (let i = currentIndex + 1; i <= maxIndex; i++) {
      const quality = qualityOrder[i];
      if (this.availableQualities.some(q => q.quality_level === quality)) {
        return quality;
      }
    }

    return null;
  }

  /**
   * Get next lower quality
   */
  getNextLowerQuality() {
    const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    const currentIndex = qualityOrder.indexOf(this.currentQuality);
    
    if (currentIndex <= 0) {
      return null;
    }

    for (let i = currentIndex - 1; i >= 0; i--) {
      const quality = qualityOrder[i];
      if (this.availableQualities.some(q => q.quality_level === quality)) {
        return quality;
      }
    }

    return null;
  }

  /**
   * Set ABR strategy
   */
  setStrategy(strategy) {
    if (Object.values(ABR_STRATEGIES).includes(strategy)) {
      this.strategy = strategy;
      console.log(`📊 ABR strategy set to: ${strategy}`);
    }
  }

  /**
   * Enable/disable auto quality
   */
  setAutoQuality(enabled) {
    this.isAutoQuality = enabled;
    
    if (enabled) {
      this.detectAndSetOptimalQuality();
    }
    
    console.log(`📊 Auto quality ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    return {
      currentQuality: this.currentQuality,
      currentSpeed: this.networkMonitor.currentSpeed,
      bufferingEvents: this.bufferingEvents,
      qualitySwitches: this.qualitySwitches,
      bytesDownloaded: this.bytesDownloaded,
      sessionDuration,
      averageSpeed: this.networkMonitor.getAverageSpeed(),
      strategy: this.strategy,
      autoQuality: this.isAutoQuality
    };
  }

  /**
   * Log session metrics to database
   */
  async logSession(videoId) {
    if (!this.userId) return;

    const metrics = this.getMetrics();
    const duration = metrics.sessionDuration;

    try {
      await logBandwidthUsage({
        userId: this.userId,
        videoId: videoId,
        qualityLevel: this.currentQuality,
        bytesDownloaded: Math.floor(this.bytesDownloaded),
        durationSeconds: duration,
        averageSpeedKbps: metrics.averageSpeed,
        bufferingEvents: this.bufferingEvents,
        qualitySwitches: this.qualitySwitches
      });

      console.log('✅ Bandwidth usage logged');
    } catch (error) {
      console.error('Error logging bandwidth usage:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy(videoId = null) {
    this.stopMonitoring();
    
    if (videoId) {
      await this.logSession(videoId);
    }

    this.networkMonitor.reset();
    this.initialized = false;
    
    console.log('✅ ABR Manager destroyed');
  }
}

export default ABRManager;
