/**
 * Image Optimization Utilities
 * Handles image compression, format conversion, and optimization
 */

import { supabase } from './supabase';

/**
 * Image formats by efficiency
 */
export const IMAGE_FORMATS = {
  avif: {
    name: 'AVIF',
    mimeType: 'image/avif',
    quality: 'best',
    compression: 0.3, // 70% smaller than JPEG
    support: 'modern'
  },
  webp: {
    name: 'WebP',
    mimeType: 'image/webp',
    quality: 'excellent',
    compression: 0.5, // 50% smaller than JPEG
    support: 'wide'
  },
  jpg: {
    name: 'JPEG',
    mimeType: 'image/jpeg',
    quality: 'good',
    compression: 1.0, // Baseline
    support: 'universal'
  },
  png: {
    name: 'PNG',
    mimeType: 'image/png',
    quality: 'lossless',
    compression: 1.2, // Often larger than JPEG
    support: 'universal'
  }
};

/**
 * Image size presets for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: {
    small: { width: 120, height: 90 },
    medium: { width: 246, height: 138 },
    large: { width: 360, height: 202 }
  },
  avatar: {
    small: { width: 32, height: 32 },
    medium: { width: 88, height: 88 },
    large: { width: 176, height: 176 }
  },
  banner: {
    small: { width: 640, height: 175 },
    medium: { width: 1280, height: 350 },
    large: { width: 2560, height: 423 }
  },
  poster: {
    small: { width: 480, height: 270 },
    medium: { width: 1280, height: 720 },
    large: { width: 1920, height: 1080 }
  }
};

/**
 * Check if browser supports image format
 */
export const isFormatSupported = (format) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  } catch (e) {
    return false;
  }
};

/**
 * Get best supported image format for browser
 */
export const getBestImageFormat = () => {
  if (isFormatSupported('avif')) return 'avif';
  if (isFormatSupported('webp')) return 'webp';
  return 'jpg';
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (baseUrl, sizes) => {
  return sizes.map(size => {
    const url = `${baseUrl}?w=${size.width}&h=${size.height}&fit=cover&q=80`;
    return `${url} ${size.width}w`;
  }).join(', ');
};

/**
 * Generate optimized image URL with parameters
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return '';

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover', // cover, contain, fill, inside, outside
    blur,
    grayscale = false
  } = options;

  // If using Supabase storage, we can't apply transformations directly
  // In production, you'd use a CDN like Cloudinary, imgix, or CloudFlare Images
  // For now, we'll return the original URL and add query params for documentation
  
  const url = new URL(imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`);
  
  if (width) url.searchParams.set('w', width);
  if (height) url.searchParams.set('h', height);
  if (quality) url.searchParams.set('q', quality);
  if (format !== 'auto') url.searchParams.set('fm', format);
  if (fit) url.searchParams.set('fit', fit);
  if (blur) url.searchParams.set('blur', blur);
  if (grayscale) url.searchParams.set('grayscale', 'true');

  return url.toString();
};

/**
 * Create responsive image sources for picture element
 */
export const createResponsiveSources = (imageUrl, type = 'thumbnail') => {
  const sizes = IMAGE_SIZES[type];
  if (!sizes) return [];

  const format = getBestImageFormat();

  return [
    {
      srcSet: getOptimizedImageUrl(imageUrl, { ...sizes.large, format }),
      media: '(min-width: 1200px)',
      type: IMAGE_FORMATS[format].mimeType
    },
    {
      srcSet: getOptimizedImageUrl(imageUrl, { ...sizes.medium, format }),
      media: '(min-width: 768px)',
      type: IMAGE_FORMATS[format].mimeType
    },
    {
      srcSet: getOptimizedImageUrl(imageUrl, { ...sizes.small, format }),
      media: '(max-width: 767px)',
      type: IMAGE_FORMATS[format].mimeType
    }
  ];
};

/**
 * Lazy load image with intersection observer
 */
export const lazyLoadImage = (imageElement, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.01,
    onLoad,
    onError
  } = options;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          const srcset = img.dataset.srcset;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }

          if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
          }

          img.addEventListener('load', () => {
            img.classList.add('loaded');
            if (onLoad) onLoad(img);
          });

          img.addEventListener('error', () => {
            img.classList.add('error');
            if (onError) onError(img);
          });

          obs.unobserve(img);
        }
      });
    }, {
      rootMargin,
      threshold
    });

    observer.observe(imageElement);
    return observer;
  } else {
    // Fallback for browsers without IntersectionObserver
    if (imageElement.dataset.src) {
      imageElement.src = imageElement.dataset.src;
    }
    if (imageElement.dataset.srcset) {
      imageElement.srcset = imageElement.dataset.srcset;
    }
    return null;
  }
};

/**
 * Preload critical images
 */
export const preloadImage = (src, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (options.crossOrigin) {
      img.crossOrigin = options.crossOrigin;
    }

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    img.src = src;
  });
};

/**
 * Preload multiple images
 */
export const preloadImages = async (urls) => {
  try {
    const promises = urls.map(url => preloadImage(url));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error preloading images:', error);
    return [];
  }
};

/**
 * Generate blur placeholder
 */
export const generateBlurPlaceholder = (imageUrl, width = 20, height = 20) => {
  return getOptimizedImageUrl(imageUrl, {
    width,
    height,
    quality: 10,
    blur: 10
  });
};

/**
 * Calculate image dimensions maintaining aspect ratio
 */
export const calculateAspectRatio = (originalWidth, originalHeight, targetWidth, targetHeight) => {
  const originalRatio = originalWidth / originalHeight;
  
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  
  if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / originalRatio)
    };
  }
  
  if (targetHeight) {
    return {
      width: Math.round(targetHeight * originalRatio),
      height: targetHeight
    };
  }
  
  return { width: originalWidth, height: originalHeight };
};

/**
 * Compress image file on client side
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              }));
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get image metadata
 */
export const getImageMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Create thumbnail from video
 */
export const createVideoThumbnail = (videoFile, timeSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'thumbnail.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, 'image/jpeg', 0.8);

      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Save image optimization metadata to database
 */
export const saveImageOptimizationMetadata = async (data) => {
  try {
    const { error } = await supabase
      .from('image_optimization_metadata')
      .insert({
        original_image_url: data.originalUrl,
        optimized_image_url: data.optimizedUrl,
        image_type: data.type, // 'thumbnail', 'banner', 'avatar', 'poster'
        format: data.format,
        width: data.width,
        height: data.height,
        file_size_bytes: data.fileSize,
        quality: data.quality,
        compression_ratio: data.compressionRatio
      });

    if (error) throw error;
    console.log('✅ Image optimization metadata saved');
  } catch (error) {
    console.error('Error saving image metadata:', error);
  }
};

/**
 * Get optimized image variants
 */
export const getOptimizedImageVariants = async (originalUrl) => {
  try {
    const { data, error } = await supabase
      .from('image_optimization_metadata')
      .select('*')
      .eq('original_image_url', originalUrl)
      .order('file_size_bytes', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching image variants:', error);
    return [];
  }
};

/**
 * Progressive image loader component helper
 */
export const createProgressiveImageLoader = (lowQualityUrl, highQualityUrl) => {
  return {
    lowQuality: lowQualityUrl,
    highQuality: highQualityUrl,
    placeholder: generateBlurPlaceholder(lowQualityUrl)
  };
};

/**
 * Estimate image file size
 */
export const estimateImageSize = (width, height, format = 'jpg', quality = 80) => {
  // Rough estimation based on format and quality
  const pixels = width * height;
  let bytesPerPixel;

  switch (format) {
    case 'png':
      bytesPerPixel = 3; // Lossless
      break;
    case 'jpg':
    case 'jpeg':
      bytesPerPixel = quality / 100; // Quality affects size
      break;
    case 'webp':
      bytesPerPixel = (quality / 100) * 0.7; // Better compression
      break;
    case 'avif':
      bytesPerPixel = (quality / 100) * 0.5; // Best compression
      break;
    default:
      bytesPerPixel = 1;
  }

  return Math.ceil(pixels * bytesPerPixel);
};

/**
 * Format image size for display
 */
export const formatImageSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default {
  IMAGE_FORMATS,
  IMAGE_SIZES,
  isFormatSupported,
  getBestImageFormat,
  generateSrcSet,
  getOptimizedImageUrl,
  createResponsiveSources,
  lazyLoadImage,
  preloadImage,
  preloadImages,
  generateBlurPlaceholder,
  calculateAspectRatio,
  compressImage,
  getImageMetadata,
  createVideoThumbnail,
  saveImageOptimizationMetadata,
  getOptimizedImageVariants,
  createProgressiveImageLoader,
  estimateImageSize,
  formatImageSize
};
