/**
 * Compression Utilities
 * Provides utilities for video compression, quality management, and optimization
 */

import { supabase } from './supabase';

/**
 * Video quality levels with their specifications
 */
export const QUALITY_LEVELS = {
  '144p': {
    label: '144p',
    width: 256,
    height: 144,
    bitrate: 300, // kbps
    audioBitrate: 64
  },
  '240p': {
    label: '240p',
    width: 426,
    height: 240,
    bitrate: 500,
    audioBitrate: 64
  },
  '360p': {
    label: '360p',
    width: 640,
    height: 360,
    bitrate: 1000,
    audioBitrate: 96
  },
  '480p': {
    label: '480p (SD)',
    width: 854,
    height: 480,
    bitrate: 2500,
    audioBitrate: 128
  },
  '720p': {
    label: '720p (HD)',
    width: 1280,
    height: 720,
    bitrate: 5000,
    audioBitrate: 128
  },
  '1080p': {
    label: '1080p (Full HD)',
    width: 1920,
    height: 1080,
    bitrate: 8000,
    audioBitrate: 192
  },
  '1440p': {
    label: '1440p (2K)',
    width: 2560,
    height: 1440,
    bitrate: 16000,
    audioBitrate: 192
  },
  '2160p': {
    label: '2160p (4K)',
    width: 3840,
    height: 2160,
    bitrate: 35000,
    audioBitrate: 256
  }
};

/**
 * Codec information
 */
export const CODECS = {
  h264: {
    name: 'H.264',
    mimeType: 'video/mp4; codecs="avc1.42E01E"',
    compatibility: 'universal',
    efficiency: 1.0
  },
  h265: {
    name: 'H.265 (HEVC)',
    mimeType: 'video/mp4; codecs="hvc1.1.6.L93.B0"',
    compatibility: 'modern',
    efficiency: 0.5 // 50% better compression
  },
  vp9: {
    name: 'VP9',
    mimeType: 'video/webm; codecs="vp9"',
    compatibility: 'modern',
    efficiency: 0.5
  },
  av1: {
    name: 'AV1',
    mimeType: 'video/webm; codecs="av01.0.05M.08"',
    compatibility: 'latest',
    efficiency: 0.3 // 70% better compression
  }
};

/**
 * Get available video quality variants for a video
 */
export const getVideoQualityVariants = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from('video_quality_variants')
      .select('*')
      .eq('video_id', videoId)
      .eq('is_ready', true)
      .order('bitrate_kbps', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quality variants:', error);
    return [];
  }
};

/**
 * Get optimal quality based on current bandwidth
 */
export const getOptimalQuality = async (bandwidthKbps, userId = null) => {
  try {
    const { data, error } = await supabase
      .rpc('get_optimal_quality_for_bandwidth', {
        p_bandwidth_kbps: bandwidthKbps,
        p_user_id: userId
      });

    if (error) throw error;
    return data || '720p';
  } catch (error) {
    console.error('Error getting optimal quality:', error);
    // Fallback logic
    if (bandwidthKbps >= 6000) return '1080p';
    if (bandwidthKbps >= 3000) return '720p';
    if (bandwidthKbps >= 1500) return '480p';
    if (bandwidthKbps >= 700) return '360p';
    return '240p';
  }
};

/**
 * Get user's bandwidth preferences
 */
export const getUserBandwidthPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_bandwidth_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No preferences found, create defaults
      const defaults = {
        user_id: userId,
        auto_quality: true,
        preferred_quality: '720p',
        max_quality: '1080p',
        data_saver_mode: false,
        preload_next_video: true,
        bandwidth_limit_mbps: null
      };

      const { data: newPrefs, error: insertError } = await supabase
        .from('user_bandwidth_preferences')
        .insert(defaults)
        .select()
        .single();

      if (insertError) throw insertError;
      return newPrefs;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bandwidth preferences:', error);
    return null;
  }
};

/**
 * Update user's bandwidth preferences
 */
export const updateBandwidthPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('user_bandwidth_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating bandwidth preferences:', error);
    throw error;
  }
};

/**
 * Log bandwidth usage
 */
export const logBandwidthUsage = async (data) => {
  try {
    const { error } = await supabase
      .from('bandwidth_usage_logs')
      .insert({
        user_id: data.userId,
        video_id: data.videoId,
        quality_level: data.qualityLevel,
        bytes_downloaded: data.bytesDownloaded,
        download_duration_seconds: data.durationSeconds,
        average_speed_kbps: data.averageSpeedKbps,
        buffering_events: data.bufferingEvents || 0,
        quality_switches: data.qualitySwitches || 0,
        session_date: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging bandwidth usage:', error);
  }
};

/**
 * Calculate bandwidth saved
 */
export const calculateBandwidthSaved = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_bandwidth_saved', {
        p_user_id: userId
      });

    if (error) throw error;
    return data?.[0] || { total_bytes_saved: 0, total_mb_saved: 0, total_gb_saved: 0 };
  } catch (error) {
    console.error('Error calculating bandwidth saved:', error);
    return { total_bytes_saved: 0, total_mb_saved: 0, total_gb_saved: 0 };
  }
};

/**
 * Get compression metadata for a video
 */
export const getCompressionMetadata = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from('video_compression_metadata')
      .select('*')
      .eq('video_id', videoId)
      .order('compression_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching compression metadata:', error);
    return null;
  }
};

/**
 * Estimate file size for quality level
 */
export const estimateFileSize = (durationSeconds, qualityLevel) => {
  const quality = QUALITY_LEVELS[qualityLevel];
  if (!quality) return 0;

  const videoBitrate = quality.bitrate * 1000; // Convert to bps
  const audioBitrate = quality.audioBitrate * 1000;
  const totalBitrate = videoBitrate + audioBitrate;

  // File size in bytes
  return Math.ceil((totalBitrate * durationSeconds) / 8);
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format bitrate to human-readable string
 */
export const formatBitrate = (kbps) => {
  if (kbps < 1000) return `${kbps} Kbps`;
  return `${(kbps / 1000).toFixed(1)} Mbps`;
};

/**
 * Calculate compression ratio
 */
export const calculateCompressionRatio = (originalSize, compressedSize) => {
  if (originalSize === 0) return 0;
  return ((1 - (compressedSize / originalSize)) * 100).toFixed(2);
};

/**
 * Check if codec is supported by browser
 */
export const isCodecSupported = (codec) => {
  const codecInfo = CODECS[codec];
  if (!codecInfo) return false;

  if (typeof MediaSource === 'undefined') return false;

  try {
    return MediaSource.isTypeSupported(codecInfo.mimeType);
  } catch (e) {
    return false;
  }
};

/**
 * Get best available codec for browser
 */
export const getBestCodec = () => {
  // Check in order of efficiency
  if (isCodecSupported('av1')) return 'av1';
  if (isCodecSupported('vp9')) return 'vp9';
  if (isCodecSupported('h265')) return 'h265';
  return 'h264'; // Universal fallback
};

/**
 * Calculate estimated data usage
 */
export const estimateDataUsage = (durationMinutes, qualityLevel) => {
  const quality = QUALITY_LEVELS[qualityLevel];
  if (!quality) return { mb: 0, gb: 0 };

  const durationSeconds = durationMinutes * 60;
  const bytes = estimateFileSize(durationSeconds, qualityLevel);
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);

  return {
    mb: Math.round(mb * 10) / 10,
    gb: Math.round(gb * 100) / 100,
    formatted: formatBytes(bytes)
  };
};

/**
 * Get quality recommendation based on connection type
 */
export const getQualityForConnection = (connectionType) => {
  // Based on Network Information API
  const recommendations = {
    'slow-2g': '144p',
    '2g': '240p',
    '3g': '360p',
    '4g': '720p',
    '5g': '1080p',
    'wifi': '1080p',
    'ethernet': '1080p'
  };

  return recommendations[connectionType] || '480p';
};

/**
 * Monitor network speed
 */
export class NetworkMonitor {
  constructor() {
    this.samples = [];
    this.maxSamples = 10;
    this.currentSpeed = 0;
  }

  /**
   * Add a speed sample
   */
  addSample(bytesDownloaded, durationMs) {
    const speedKbps = (bytesDownloaded * 8) / durationMs;
    this.samples.push(speedKbps);

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.currentSpeed = this.getAverageSpeed();
  }

  /**
   * Get average speed from samples
   */
  getAverageSpeed() {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.samples.length);
  }

  /**
   * Get recommended quality
   */
  getRecommendedQuality(userId = null) {
    return getOptimalQuality(this.currentSpeed, userId);
  }

  /**
   * Check if we should upgrade quality
   */
  canUpgrade(currentQuality) {
    const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    const currentIndex = qualityOrder.indexOf(currentQuality);
    
    if (currentIndex === qualityOrder.length - 1) return false;

    const nextQuality = qualityOrder[currentIndex + 1];
    const requiredBitrate = QUALITY_LEVELS[nextQuality].bitrate;

    // Need 50% more bandwidth than bitrate for buffer
    return this.currentSpeed >= requiredBitrate * 1.5;
  }

  /**
   * Check if we should downgrade quality
   */
  shouldDowngrade(currentQuality) {
    const requiredBitrate = QUALITY_LEVELS[currentQuality]?.bitrate || 0;

    // Downgrade if speed is less than 125% of required bitrate
    return this.currentSpeed < requiredBitrate * 1.25;
  }

  /**
   * Reset monitor
   */
  reset() {
    this.samples = [];
    this.currentSpeed = 0;
  }
}

/**
 * Preload quality level
 */
export const preloadQuality = (videoUrl, qualityLevel) => {
  try {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = videoUrl;
    link.setAttribute('data-quality', qualityLevel);
    document.head.appendChild(link);
  } catch (error) {
    console.error('Error preloading video:', error);
  }
};

/**
 * Get user's bandwidth usage stats
 */
export const getUserBandwidthStats = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('bandwidth_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('session_date', startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const totalBytes = data.reduce((sum, log) => sum + log.bytes_downloaded, 0);
    const totalBuffering = data.reduce((sum, log) => sum + log.buffering_events, 0);
    const totalSwitches = data.reduce((sum, log) => sum + log.quality_switches, 0);
    const avgSpeed = data.length > 0 
      ? data.reduce((sum, log) => sum + log.average_speed_kbps, 0) / data.length 
      : 0;

    // Quality distribution
    const qualityDist = data.reduce((acc, log) => {
      acc[log.quality_level] = (acc[log.quality_level] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBytes,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
      totalGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalSessions: data.length,
      totalBuffering,
      totalSwitches,
      avgSpeed: Math.round(avgSpeed),
      qualityDistribution: qualityDist,
      periodDays: days
    };
  } catch (error) {
    console.error('Error fetching bandwidth stats:', error);
    return null;
  }
};

export default {
  QUALITY_LEVELS,
  CODECS,
  getVideoQualityVariants,
  getOptimalQuality,
  getUserBandwidthPreferences,
  updateBandwidthPreferences,
  logBandwidthUsage,
  calculateBandwidthSaved,
  getCompressionMetadata,
  estimateFileSize,
  formatBytes,
  formatBitrate,
  calculateCompressionRatio,
  isCodecSupported,
  getBestCodec,
  estimateDataUsage,
  getQualityForConnection,
  NetworkMonitor,
  preloadQuality,
  getUserBandwidthStats
};
