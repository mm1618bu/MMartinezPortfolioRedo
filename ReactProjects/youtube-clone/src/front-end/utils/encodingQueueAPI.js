/**
 * Encoding Queue API
 * Manages asynchronous video encoding jobs
 */

import { supabase } from './supabase';

/**
 * Create a new encoding job
 */
export const createEncodingJob = async (videoId, userId, fileUrl, fileSize, resolution = null, outputFormats = ['720p', '480p', '360p'], priority = 5) => {
  try {
    const { data, error } = await supabase.rpc('create_encoding_job', {
      p_video_id: videoId,
      p_user_id: userId,
      p_input_file_url: fileUrl,
      p_input_file_size: fileSize,
      p_input_resolution: resolution,
      p_output_formats: outputFormats,
      p_priority: priority
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating encoding job:', error);
    throw error;
  }
};

/**
 * Get encoding job status for a video
 */
export const getEncodingJobStatus = async (videoId) => {
  try {
    const { data, error } = await supabase.rpc('get_encoding_job_status', {
      p_video_id: videoId
    });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting encoding job status:', error);
    return null;
  }
};

/**
 * Get all encoding jobs for a user
 */
export const getUserEncodingJobs = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase.rpc('get_user_encoding_jobs', {
      p_user_id: userId,
      p_limit: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user encoding jobs:', error);
    return [];
  }
};

/**
 * Cancel an encoding job
 */
export const cancelEncodingJob = async (jobId) => {
  try {
    const { data, error } = await supabase.rpc('cancel_encoding_job', {
      p_job_id: jobId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling encoding job:', error);
    throw error;
  }
};

/**
 * Subscribe to encoding job updates in real-time
 */
export const subscribeToEncodingJob = (videoId, callback) => {
  const subscription = supabase
    .channel(`encoding_job:${videoId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'encoding_jobs',
        filter: `video_id=eq.${videoId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to all user's encoding jobs
 */
export const subscribeToUserEncodingJobs = (userId, callback) => {
  const subscription = supabase
    .channel(`user_encoding_jobs:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'encoding_jobs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Get encoding queue statistics
 */
export const getEncodingQueueStats = async () => {
  try {
    const { data, error } = await supabase
      .from('encoding_jobs')
      .select('status, priority')
      .in('status', ['queued', 'processing']);

    if (error) throw error;

    const stats = {
      queued: data.filter(j => j.status === 'queued').length,
      processing: data.filter(j => j.status === 'processing').length,
      highPriority: data.filter(j => j.priority <= 3).length,
      mediumPriority: data.filter(j => j.priority > 3 && j.priority <= 7).length,
      lowPriority: data.filter(j => j.priority > 7).length
    };

    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }
};

/**
 * Format encoding status for display
 */
export const formatEncodingStatus = (status) => {
  const statusMap = {
    queued: { label: 'Queued', color: '#ffa726', icon: '⏳' },
    processing: { label: 'Processing', color: '#42a5f5', icon: '⚙️' },
    completed: { label: 'Completed', color: '#66bb6a', icon: '✓' },
    failed: { label: 'Failed', color: '#ef5350', icon: '✗' },
    cancelled: { label: 'Cancelled', color: '#bdbdbd', icon: '⊘' }
  };

  return statusMap[status] || { label: status, color: '#757575', icon: '?' };
};

/**
 * Calculate estimated wait time based on queue position
 */
export const estimateWaitTime = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('encoding_jobs')
      .select('id, priority, queued_at')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('queued_at', { ascending: true });

    if (error) throw error;

    const position = data.findIndex(job => job.id === jobId);
    if (position === -1) return 0;

    // Estimate ~2 minutes per job (this would be based on actual metrics)
    const estimatedMinutes = (position + 1) * 2;
    
    return estimatedMinutes;
  } catch (error) {
    console.error('Error estimating wait time:', error);
    return null;
  }
};

/**
 * Retry a failed encoding job
 */
export const retryEncodingJob = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('encoding_jobs')
      .update({
        status: 'queued',
        error_message: null,
        progress: 0,
        current_step: null,
        started_at: null,
        completed_at: null,
        retry_count: supabase.rpc('increment', { x: 1 })
      })
      .eq('id', jobId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error retrying encoding job:', error);
    throw error;
  }
};
