/**
 * Video Metadata Extraction Utilities
 * Extracts comprehensive metadata from video files
 */

/**
 * Extract all available metadata from video file
 * @param {File} file - The video file
 * @returns {Promise} - Resolves with metadata object
 */
export async function extractVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const cleanup = () => {
      window.URL.revokeObjectURL(video.src);
    };
    
    video.onloadedmetadata = () => {
      const metadata = {
        // Basic info
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        
        // Video dimensions
        width: video.videoWidth,
        height: video.videoHeight,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        
        // Duration
        duration: Math.round(video.duration),
        
        // Aspect ratio
        aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight),
        
        // Quality classification
        quality: classifyQuality(video.videoWidth, video.videoHeight),
        
        // File properties (if available from browser)
        lastModified: file.lastModified,
        lastModifiedDate: new Date(file.lastModified).toISOString(),
      };
      
      cleanup();
      resolve(metadata);
    };
    
    video.onerror = (error) => {
      cleanup();
      reject(new Error('Failed to extract video metadata: ' + (error.message || 'Unknown error')));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate aspect ratio in standard format (e.g., "16:9")
 */
function calculateAspectRatio(width, height) {
  if (!width || !height) return 'unknown';
  
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;
  
  // Common aspect ratios
  const commonRatios = {
    '16:9': [16, 9],
    '4:3': [4, 3],
    '21:9': [21, 9],
    '1:1': [1, 1],
    '9:16': [9, 16], // Vertical/portrait
  };
  
  // Check if matches common ratio
  for (const [name, [w, h]] of Object.entries(commonRatios)) {
    if (ratioWidth === w && ratioHeight === h) {
      return name;
    }
  }
  
  return `${ratioWidth}:${ratioHeight}`;
}

/**
 * Classify video quality based on resolution
 */
function classifyQuality(width, height) {
  if (!width || !height) return 'unknown';
  
  const pixels = width * height;
  
  // 8K
  if (width >= 7680 && height >= 4320) return '8K';
  // 4K UHD
  if (width >= 3840 && height >= 2160) return '4K';
  // 2K QHD
  if (width >= 2560 && height >= 1440) return '2K';
  // Full HD
  if (width >= 1920 && height >= 1080) return '1080p';
  // HD
  if (width >= 1280 && height >= 720) return '720p';
  // SD
  if (width >= 854 && height >= 480) return '480p';
  // Lower quality
  if (width >= 640 && height >= 360) return '360p';
  
  return '240p';
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get orientation from aspect ratio
 */
export function getOrientation(width, height) {
  if (!width || !height) return 'unknown';
  const ratio = width / height;
  
  if (ratio > 1.3) return 'landscape';
  if (ratio < 0.8) return 'portrait';
  return 'square';
}

/**
 * Create a summary object suitable for display
 */
export function createMetadataSummary(metadata) {
  return {
    resolution: metadata.resolution,
    quality: metadata.quality,
    aspectRatio: metadata.aspectRatio,
    orientation: getOrientation(metadata.width, metadata.height),
    fileSize: formatFileSize(metadata.fileSize),
    duration: formatDuration(metadata.duration),
    format: metadata.mimeType.split('/')[1]?.toUpperCase() || 'Unknown',
  };
}

/**
 * Format duration as HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate metadata meets minimum requirements
 */
export function validateMetadata(metadata) {
  const errors = [];
  
  if (!metadata.width || !metadata.height) {
    errors.push('Could not determine video dimensions');
  }
  
  if (!metadata.duration || metadata.duration <= 0) {
    errors.push('Could not determine video duration');
  }
  
  if (metadata.width < 320 || metadata.height < 240) {
    errors.push('Video resolution is too low (minimum 320x240)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
