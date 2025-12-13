/**
 * Playback Analytics Utilities
 * Tracks video playback events and watch time
 */

import { supabase } from './supabase';

/**
 * Get browser information
 */
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';
  
  return browser;
};

/**
 * Get device type
 */
const getDeviceType = () => {
  const ua = navigator.userAgent;
  
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
};

/**
 * PlaybackTracker class - Manages playback session and events
 */
export class PlaybackTracker {
  constructor(videoId, userId = null) {
    this.videoId = videoId;
    this.userId = userId;
    this.sessionId = null;
    this.startTime = Date.now();
    this.watchTime = 0;
    this.lastPosition = 0;
    this.videoDuration = 0;
    this.isTracking = false;
    this.heartbeatInterval = null;
    this.updateInterval = null;
  }

  /**
   * Start tracking session
   */
  async startSession(videoDuration) {
    this.videoDuration = videoDuration;
    
    try {
      const { data, error } = await supabase
        .from('playback_sessions')
        .insert([{
          video_id: this.videoId,
          user_id: this.userId,
          device_type: getDeviceType(),
          browser: getBrowserInfo(),
          session_start: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      this.sessionId = data.id;
      this.isTracking = true;
      
      console.log('📊 Playback session started:', this.sessionId);
      
      // Start periodic updates every 10 seconds
      this.startPeriodicUpdates();
      
      return this.sessionId;
    } catch (error) {
      console.error('Error starting playback session:', error);
      return null;
    }
  }

  /**
   * Log a playback event
   */
  async logEvent(eventType, timestampSeconds, eventData = {}) {
    if (!this.sessionId) {
      console.warn('No active session for event:', eventType);
      return;
    }

    try {
      await supabase
        .from('playback_events')
        .insert([{
          session_id: this.sessionId,
          video_id: this.videoId,
          event_type: eventType,
          timestamp_seconds: timestampSeconds,
          event_data: eventData
        }]);
      
      console.log(`📍 Event logged: ${eventType} at ${timestampSeconds.toFixed(2)}s`);
    } catch (error) {
      console.error('Error logging playback event:', error);
    }
  }

  /**
   * Update watch time
   */
  updateWatchTime(currentPosition) {
    if (!this.isTracking) return;
    
    // Calculate time elapsed since last update
    const timeDiff = Math.abs(currentPosition - this.lastPosition);
    
    // Only count if reasonable (not seeking more than 5 seconds)
    if (timeDiff < 5) {
      this.watchTime += timeDiff;
    }
    
    this.lastPosition = currentPosition;
  }

  /**
   * Start periodic session updates
   */
  startPeriodicUpdates() {
    // Update session every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updateSession();
    }, 10000);
  }

  /**
   * Update session with current metrics
   */
  async updateSession(currentPosition = null) {
    if (!this.sessionId || !this.isTracking) return;

    const position = currentPosition || this.lastPosition;
    const completionPercentage = this.videoDuration > 0 
      ? (position / this.videoDuration) * 100 
      : 0;

    try {
      await supabase
        .from('playback_sessions')
        .update({
          total_watch_time: Math.floor(this.watchTime),
          completion_percentage: Math.min(completionPercentage, 100).toFixed(2),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.sessionId);
      
      console.log(`📊 Session updated: ${Math.floor(this.watchTime)}s watched, ${completionPercentage.toFixed(1)}% complete`);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  /**
   * Update watch history
   */
  async updateWatchHistory(currentPosition) {
    if (!this.userId) return;

    const completionPercentage = this.videoDuration > 0 
      ? (currentPosition / this.videoDuration) * 100 
      : 0;
    
    const completed = completionPercentage >= 90;

    try {
      await supabase
        .from('watch_history')
        .upsert({
          user_id: this.userId,
          video_id: this.videoId,
          last_position: currentPosition,
          watch_time: Math.floor(this.watchTime),
          completed: completed,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });
      
      console.log(`💾 Watch history updated: position ${currentPosition.toFixed(2)}s`);
    } catch (error) {
      console.error('Error updating watch history:', error);
    }
  }

  /**
   * End tracking session
   */
  async endSession(finalPosition) {
    if (!this.sessionId || !this.isTracking) return;

    this.isTracking = false;
    
    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Final update
    this.updateWatchTime(finalPosition);
    await this.updateSession(finalPosition);
    
    // Update session end time
    try {
      await supabase
        .from('playback_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_watch_time: Math.floor(this.watchTime),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.sessionId);
      
      console.log('📊 Playback session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }

    // Update watch history
    if (this.userId) {
      await this.updateWatchHistory(finalPosition);
    }
  }

  /**
   * Handle video play event
   */
  async onPlay(currentPosition) {
    await this.logEvent('play', currentPosition);
  }

  /**
   * Handle video pause event
   */
  async onPause(currentPosition) {
    this.updateWatchTime(currentPosition);
    await this.logEvent('pause', currentPosition);
    await this.updateSession(currentPosition);
  }

  /**
   * Handle video seek event
   */
  async onSeek(fromPosition, toPosition) {
    await this.logEvent('seek', toPosition, {
      from: fromPosition,
      to: toPosition,
      delta: toPosition - fromPosition
    });
    this.lastPosition = toPosition;
  }

  /**
   * Handle video ended event
   */
  async onEnded(finalPosition) {
    await this.logEvent('ended', finalPosition);
    await this.endSession(finalPosition);
  }

  /**
   * Handle quality change
   */
  async onQualityChange(currentPosition, quality) {
    await this.logEvent('quality_change', currentPosition, { quality });
    
    // Update session quality
    try {
      await supabase
        .from('playback_sessions')
        .update({ quality_level: quality })
        .eq('id', this.sessionId);
    } catch (error) {
      console.error('Error updating quality:', error);
    }
  }

  /**
   * Handle playback speed change
   */
  async onSpeedChange(currentPosition, speed) {
    await this.logEvent('speed_change', currentPosition, { speed });
    
    // Update session speed
    try {
      await supabase
        .from('playback_sessions')
        .update({ playback_speed: speed })
        .eq('id', this.sessionId);
    } catch (error) {
      console.error('Error updating speed:', error);
    }
  }

  /**
   * Clean up on component unmount
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.isTracking = false;
  }
}

/**
 * Get user's watch history
 */
export const getUserWatchHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        *,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          channel_name
        )
      `)
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};

/**
 * Get resume position for a video
 */
export const getResumePosition = async (userId, videoId) => {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('last_position, completed')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error) throw error;
    
    // Don't resume if already completed
    if (data.completed) return null;
    
    // Only resume if watched at least 5 seconds and not near the end
    if (data.last_position > 5 && data.last_position < data.duration - 10) {
      return data.last_position;
    }
    
    return null;
  } catch (error) {
    // No history found
    return null;
  }
};

/**
 * Get video analytics for creators
 */
export const getVideoAnalytics = async (videoId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('playback_sessions')
      .select('*')
      .eq('video_id', videoId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Calculate metrics
    const totalSessions = data.length;
    const totalWatchTime = data.reduce((sum, s) => sum + (s.total_watch_time || 0), 0);
    const avgWatchTime = totalSessions > 0 ? totalWatchTime / totalSessions : 0;
    const avgCompletion = totalSessions > 0 
      ? data.reduce((sum, s) => sum + parseFloat(s.completion_percentage || 0), 0) / totalSessions 
      : 0;

    return {
      totalSessions,
      totalWatchTime,
      avgWatchTime,
      avgCompletion,
      sessions: data
    };
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    return null;
  }
};

/**
 * Clear user's watch history
 */
export const clearWatchHistory = async (userId) => {
  try {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error clearing watch history:', error);
    throw error;
  }
};

/**
 * Remove specific video from watch history
 */
export const removeFromWatchHistory = async (userId, videoId) => {
  try {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing from watch history:', error);
    throw error;
  }
};
