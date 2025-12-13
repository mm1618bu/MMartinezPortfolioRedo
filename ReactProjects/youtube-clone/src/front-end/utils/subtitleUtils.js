/**
 * Subtitle Utilities
 * Handles subtitle file conversion and validation
 */

/**
 * Convert SRT subtitle format to WebVTT format
 * @param {string} srtContent - SRT file content
 * @returns {string} - WebVTT formatted content
 */
export const convertSRTtoVTT = (srtContent) => {
  // Add WEBVTT header
  let vttContent = 'WEBVTT\n\n';
  
  // Replace SRT timestamp format (00:00:00,000) with VTT format (00:00:00.000)
  vttContent += srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  
  return vttContent;
};

/**
 * Validate subtitle file
 * @param {File} file - Subtitle file
 * @returns {Object} - Validation result
 */
export const validateSubtitleFile = (file) => {
  const errors = [];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FORMATS = ['.vtt', '.srt'];
  
  // Check file size
  if (file.size > MAX_SIZE) {
    errors.push(`Subtitle file is too large. Maximum size is ${formatBytes(MAX_SIZE)}`);
  }
  
  // Check file format
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_FORMATS.includes(extension)) {
    errors.push(`Invalid format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Read subtitle file content
 * @param {File} file - Subtitle file
 * @returns {Promise<string>} - File content
 */
export const readSubtitleFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read subtitle file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Get language options for subtitles
 * @returns {Array} - Array of language objects
 */
export const getLanguageOptions = () => {
  return [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'ru', label: 'Russian' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'nl', label: 'Dutch' },
    { code: 'pl', label: 'Polish' },
    { code: 'tr', label: 'Turkish' },
  ];
};

/**
 * Parse VTT cues for preview
 * @param {string} vttContent - VTT file content
 * @returns {Array} - Array of cue objects
 */
export const parseVTTCues = (vttContent) => {
  const lines = vttContent.split('\n');
  const cues = [];
  let currentCue = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip WEBVTT header and empty lines
    if (line === '' || line.startsWith('WEBVTT')) continue;
    
    // Check if this is a timestamp line
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(t => t.trim());
      currentCue = { start, end, text: '' };
    } else if (currentCue) {
      // Add text to current cue
      currentCue.text += (currentCue.text ? ' ' : '') + line;
      
      // If next line is empty or doesn't exist, save the cue
      if (i + 1 >= lines.length || lines[i + 1].trim() === '') {
        cues.push(currentCue);
        currentCue = null;
      }
    }
  }
  
  return cues;
};
