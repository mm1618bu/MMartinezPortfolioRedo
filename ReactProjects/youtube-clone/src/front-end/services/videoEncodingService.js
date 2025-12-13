/**
 * Video Encoding Service
 * React client for backend FFmpeg API
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Extract video metadata using backend
 * @param {File} videoFile - Video file to analyze
 * @returns {Promise<Object>} Metadata object
 */
export async function extractVideoMetadata(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch(`${BACKEND_URL}/api/videos/metadata`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract metadata');
  }

  return response.json();
}

/**
 * Generate video thumbnail
 * @param {File} videoFile - Video file
 * @param {number} timestamp - Time in seconds
 * @returns {Promise<Blob>} Thumbnail image blob
 */
export async function generateThumbnail(videoFile, timestamp = 5) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('timestamp', timestamp.toString());

  const response = await fetch(`${BACKEND_URL}/api/videos/thumbnail`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate thumbnail');
  }

  return response.blob();
}

/**
 * Encode video to specific quality with progress tracking
 * @param {File} videoFile - Video file to encode
 * @param {string} quality - Quality preset (1080p, 720p, 480p, 360p)
 * @param {Function} onProgress - Progress callback (percent, fps, speed)
 * @returns {Promise<Object>} Encoded video info
 */
export async function encodeVideo(videoFile, quality = '720p', onProgress = null) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('quality', quality);

  const response = await fetch(`${BACKEND_URL}/api/videos/encode`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start encoding');
  }

  // Handle Server-Sent Events for progress
  if (onProgress && response.headers.get('content-type')?.includes('text/event-stream')) {
    return new Promise((resolve, reject) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const readStream = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            reject(new Error('Stream ended without completion'));
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                onProgress(data.percent, data.fps, data.speed);
              } else if (data.type === 'complete') {
                resolve(data.result);
                return;
              } else if (data.type === 'error') {
                reject(new Error(data.message));
                return;
              }
            }
          }

          readStream(); // Continue reading
        } catch (error) {
          reject(error);
        }
      };

      readStream();
    });
  }

  // Fallback: return JSON response if not SSE
  return response.json();
}

/**
 * Encode video to multiple qualities
 * @param {File} videoFile - Video file to encode
 * @param {string[]} qualities - Array of quality presets
 * @returns {Promise<Object[]>} Array of encoded video info
 */
export async function encodeMultipleQualities(videoFile, qualities = ['1080p', '720p', '480p']) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('qualities', JSON.stringify(qualities));

  const response = await fetch(`${BACKEND_URL}/api/videos/encode-multiple`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to encode videos');
  }

  return response.json();
}

/**
 * Optimize video for web streaming
 * @param {File} videoFile - Video file to optimize
 * @returns {Promise<Object>} Optimized video info
 */
export async function optimizeForWeb(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch(`${BACKEND_URL}/api/videos/optimize`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to optimize video');
  }

  return response.json();
}

/**
 * Health check for backend API
 * @returns {Promise<boolean>} true if backend is available
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get available encoding quality presets
 * @returns {Object} Quality presets configuration
 */
export function getQualityPresets() {
  return {
    '1080p': { label: '1080p Full HD', bitrate: '5Mbps', resolution: '1920x1080' },
    '720p': { label: '720p HD', bitrate: '2.5Mbps', resolution: '1280x720' },
    '480p': { label: '480p SD', bitrate: '1Mbps', resolution: '854x480' },
    '360p': { label: '360p Low', bitrate: '500Kbps', resolution: '640x360' }
  };
}

/**
 * React Hook: Use video encoding with state management
 * @param {File} videoFile - Video file to encode
 * @param {string} quality - Quality preset
 * @returns {Object} Encoding state and controls
 */
export function useVideoEncoding(videoFile, quality) {
  const [state, setState] = React.useState({
    isEncoding: false,
    progress: 0,
    fps: 0,
    speed: '0x',
    error: null,
    result: null
  });

  const encode = async () => {
    setState(prev => ({ ...prev, isEncoding: true, error: null }));

    try {
      const result = await encodeVideo(
        videoFile,
        quality,
        (percent, fps, speed) => {
          setState(prev => ({ ...prev, progress: percent, fps, speed }));
        }
      );

      setState(prev => ({ ...prev, isEncoding: false, result }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isEncoding: false, error: error.message }));
      throw error;
    }
  };

  return { ...state, encode };
}
