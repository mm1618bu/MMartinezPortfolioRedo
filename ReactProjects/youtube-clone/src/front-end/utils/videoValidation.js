/**
 * Video Validation Utilities
 * Validates video format, size, and duration before upload
 */

// Validation Configuration
const VIDEO_CONSTRAINTS = {
  // Allowed video formats (MIME types)
  allowedFormats: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-matroska', // .mkv
    'video/mpeg',
  ],
  
  // File extensions mapping
  allowedExtensions: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.mpeg', '.mpg'],
  
  // Maximum file size in bytes (500 MB)
  maxSizeBytes: 500 * 1024 * 1024,
  
  // Minimum file size in bytes (100 KB)
  minSizeBytes: 100 * 1024,
  
  // Maximum duration in seconds (2 hours)
  maxDurationSeconds: 2 * 60 * 60,
  
  // Minimum duration in seconds (1 second)
  minDurationSeconds: 1,
};

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format seconds to readable duration (HH:MM:SS or MM:SS)
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate video file format
 */
export function validateFormat(file) {
  const errors = [];
  
  // Check MIME type
  if (!VIDEO_CONSTRAINTS.allowedFormats.includes(file.type)) {
    // Check file extension as fallback
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!VIDEO_CONSTRAINTS.allowedExtensions.includes(extension)) {
      errors.push({
        field: 'format',
        message: `Invalid video format. Allowed formats: ${VIDEO_CONSTRAINTS.allowedExtensions.join(', ')}`,
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate video file size
 */
export function validateSize(file) {
  const errors = [];
  
  if (file.size > VIDEO_CONSTRAINTS.maxSizeBytes) {
    errors.push({
      field: 'size',
      message: `File size exceeds maximum allowed size of ${formatBytes(VIDEO_CONSTRAINTS.maxSizeBytes)}. Your file: ${formatBytes(file.size)}`,
    });
  }
  
  if (file.size < VIDEO_CONSTRAINTS.minSizeBytes) {
    errors.push({
      field: 'size',
      message: `File size is below minimum required size of ${formatBytes(VIDEO_CONSTRAINTS.minSizeBytes)}. Your file: ${formatBytes(file.size)}`,
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate video duration (requires video element metadata)
 * Returns a Promise that resolves with validation result and metadata
 */
export function validateDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);
      const errors = [];
      
      if (isNaN(duration) || duration === 0) {
        errors.push({
          field: 'duration',
          message: 'Unable to determine video duration. The file may be corrupted.',
        });
      } else if (duration > VIDEO_CONSTRAINTS.maxDurationSeconds) {
        errors.push({
          field: 'duration',
          message: `Video duration exceeds maximum allowed duration of ${formatDuration(VIDEO_CONSTRAINTS.maxDurationSeconds)}. Your video: ${formatDuration(duration)}`,
        });
      } else if (duration < VIDEO_CONSTRAINTS.minDurationSeconds) {
        errors.push({
          field: 'duration',
          message: `Video duration is below minimum required duration of ${formatDuration(VIDEO_CONSTRAINTS.minDurationSeconds)}. Your video: ${formatDuration(duration)}`,
        });
      }
      
      // Extract metadata
      const metadata = {
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight),
        quality: classifyQuality(video.videoWidth, video.videoHeight),
      };
      
      resolve({
        valid: errors.length === 0,
        errors,
        metadata,
      });
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        valid: false,
        errors: [{
          field: 'duration',
          message: 'Unable to load video metadata. The file may be corrupted or in an unsupported format.',
        }],
        metadata: null,
      });
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
    '9:16': [9, 16],
  };
  
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
  
  if (width >= 7680) return '8K';
  if (width >= 3840) return '4K';
  if (width >= 2560) return '2K';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  if (width >= 854) return '480p';
  if (width >= 640) return '360p';
  
  return '240p';
}

/**
 * Comprehensive video validation
 * Validates format, size, and duration
 * Returns a Promise with complete validation results
 */
export async function validateVideo(file) {
  if (!file) {
    return {
      valid: false,
      errors: [{
        field: 'file',
        message: 'No video file selected',
      }],
    };
  }
  
  const allErrors = [];
  
  // Validate format
  const formatResult = validateFormat(file);
  allErrors.push(...formatResult.errors);
  
  // Validate size
  const sizeResult = validateSize(file);
  allErrors.push(...sizeResult.errors);
  
  // Validate duration (async)
  const durationResult = await validateDuration(file);
  allErrors.push(...durationResult.errors);
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    duration: durationResult.metadata?.duration || 0,
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type,
    metadata: durationResult.metadata, // Include extracted metadata
  };
}

/**
 * Get video constraints for display in UI
 */
export function getVideoConstraints() {
  return {
    formats: VIDEO_CONSTRAINTS.allowedExtensions.join(', '),
    maxSize: formatBytes(VIDEO_CONSTRAINTS.maxSizeBytes),
    minSize: formatBytes(VIDEO_CONSTRAINTS.minSizeBytes),
    maxDuration: formatDuration(VIDEO_CONSTRAINTS.maxDurationSeconds),
    minDuration: formatDuration(VIDEO_CONSTRAINTS.minDurationSeconds),
  };
}
