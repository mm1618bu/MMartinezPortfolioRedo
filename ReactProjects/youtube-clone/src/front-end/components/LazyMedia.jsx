/**
 * LazyImage Component
 * Lazy loads images with blur placeholder and responsive sources
 */

import { useState, useEffect, useRef } from 'react';
import { 
  lazyLoadImage, 
  generateBlurPlaceholder, 
  createResponsiveSources,
  getOptimizedImageUrl 
} from '../utils/imageOptimization';

export default function LazyImage({
  src,
  alt,
  type = 'thumbnail', // thumbnail, avatar, banner, poster
  width,
  height,
  className = '',
  style = {},
  placeholder = true,
  responsive = true,
  onLoad,
  onError,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current || !src) return;

    // Set up lazy loading
    observerRef.current = lazyLoadImage(imgRef.current, {
      onLoad: (img) => {
        setLoaded(true);
        if (onLoad) onLoad(img);
      },
      onError: (img) => {
        setError(true);
        if (onError) onError(img);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, onLoad, onError]);

  // Generate placeholder
  const blurUrl = placeholder ? generateBlurPlaceholder(src) : null;

  // Generate responsive sources if enabled
  const sources = responsive ? createResponsiveSources(src, type) : [];

  // Inline styles for blur effect
  const imageStyle = {
    ...style,
    width: width || '100%',
    height: height || 'auto',
    transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
    filter: loaded ? 'blur(0)' : 'blur(10px)',
    opacity: loaded ? 1 : 0.7,
    objectFit: 'cover'
  };

  // Error fallback
  if (error) {
    return (
      <div
        className={`lazy-image-error ${className}`}
        style={{
          ...imageStyle,
          backgroundColor: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '12px'
        }}
      >
        <span>⚠️ Failed to load image</span>
      </div>
    );
  }

  // Use picture element for responsive images
  if (responsive && sources.length > 0) {
    return (
      <picture className={className}>
        {sources.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            media={source.media}
            type={source.type}
          />
        ))}
        <img
          ref={imgRef}
          data-src={src}
          src={blurUrl || undefined}
          alt={alt}
          style={imageStyle}
          loading="lazy"
          {...props}
        />
      </picture>
    );
  }

  // Simple img element
  return (
    <img
      ref={imgRef}
      data-src={src}
      src={blurUrl || undefined}
      alt={alt}
      className={className}
      style={imageStyle}
      loading="lazy"
      {...props}
    />
  );
}

/**
 * LazyVideo Component
 * Lazy loads video with poster and preload control
 */
export function LazyVideo({
  src,
  poster,
  width,
  height,
  className = '',
  style = {},
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  preload = 'metadata', // none, metadata, auto
  onLoad,
  onError,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Use IntersectionObserver to load video when near viewport
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !shouldLoad) {
              setShouldLoad(true);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '100px', // Load 100px before entering viewport
          threshold: 0.01
        }
      );

      observerRef.current.observe(videoRef.current);
    } else {
      // Fallback: load immediately
      setShouldLoad(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [shouldLoad]);

  const handleLoadedData = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (onError) onError();
  };

  const videoStyle = {
    ...style,
    width: width || '100%',
    height: height || 'auto',
    backgroundColor: '#000'
  };

  return (
    <div className={`lazy-video-container ${className}`} style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        src={shouldLoad ? src : undefined}
        poster={poster}
        style={videoStyle}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload={shouldLoad ? preload : 'none'}
        onLoadedData={handleLoadedData}
        onError={handleError}
        {...props}
      />
      {!loaded && shouldLoad && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '14px',
            pointerEvents: 'none'
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}

/**
 * LazyBackground Component
 * Lazy loads background image for divs
 */
export function LazyBackground({
  src,
  children,
  className = '',
  style = {},
  placeholder = true,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const divRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;

    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !shouldLoad) {
              setShouldLoad(true);
              
              // Load the image
              const img = new Image();
              img.onload = () => setLoaded(true);
              img.src = src;
              
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.01
        }
      );

      observerRef.current.observe(divRef.current);
    } else {
      setShouldLoad(true);
      const img = new Image();
      img.onload = () => setLoaded(true);
      img.src = src;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, shouldLoad]);

  const blurUrl = placeholder ? generateBlurPlaceholder(src) : null;

  const backgroundStyle = {
    ...style,
    backgroundImage: loaded ? `url(${src})` : blurUrl ? `url(${blurUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'filter 0.3s ease-in-out',
    filter: loaded ? 'blur(0)' : 'blur(10px)'
  };

  return (
    <div
      ref={divRef}
      className={className}
      style={backgroundStyle}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Progressive Image Component
 * Shows low quality placeholder while loading high quality image
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  style = {},
  quality = 80,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Load low quality placeholder first
    const lowQualityUrl = getOptimizedImageUrl(src, {
      quality: 10,
      blur: 10
    });

    setCurrentSrc(lowQualityUrl);

    // Then load high quality image
    const highQualityImg = new Image();
    highQualityImg.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    highQualityImg.src = src;

  }, [src]);

  const imageStyle = {
    ...style,
    transition: 'filter 0.5s ease-in-out',
    filter: loading ? 'blur(20px)' : 'blur(0)',
    transform: loading ? 'scale(1.1)' : 'scale(1)'
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      style={imageStyle}
      {...props}
    />
  );
}

/**
 * Thumbnail with lazy loading
 * Optimized for video thumbnails
 */
export function VideoThumbnail({
  src,
  alt,
  duration,
  watched = false,
  progress = 0,
  className = '',
  onClick,
  ...props
}) {
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`video-thumbnail ${className}`}
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={onClick}
    >
      <LazyImage
        src={src}
        alt={alt}
        type="thumbnail"
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '8px'
        }}
        {...props}
      />
      
      {/* Duration badge */}
      {duration && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          {formatDuration(duration)}
        </div>
      )}

      {/* Progress bar */}
      {watched && progress > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#ff0000',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      )}
    </div>
  );
}
