/**
 * VideoAd Component
 * Displays video advertisements (pre-roll) before main video content
 */

import React, { useEffect, useRef, useState } from 'react';
import { adTargetingEngine, AdSkipController } from '../utils/adSimulationEngine';

const VideoAd = ({ ad, onComplete, onSkip }) => {
  const videoRef = useRef(null);
  const skipControllerRef = useRef(new AdSkipController(5)); // 5 seconds before skip
  const [canSkip, setCanSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(5);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    if (ad) {
      // Track impression when ad starts
      adTargetingEngine.trackImpression(ad);
      skipControllerRef.current.start();
    }
  }, [ad]);

  useEffect(() => {
    // Update skip button state
    const interval = setInterval(() => {
      const controller = skipControllerRef.current;
      const skippable = controller.update();
      setCanSkip(skippable);
      setSkipCountdown(controller.getTimeUntilSkip());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleVideoEnd = () => {
    adTargetingEngine.trackCompletion(ad);
    onComplete?.();
  };

  const handleSkip = () => {
    if (canSkip) {
      adTargetingEngine.trackClick(ad); // Track skip as interaction
      onSkip?.();
    }
  };

  const handleAdClick = () => {
    adTargetingEngine.trackClick(ad);
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setAdProgress(progress);
    }
  };

  if (!ad) return null;

  return (
    <div className="video-ad-container">
      <div className="video-ad-overlay">
        {/* Ad Badge */}
        <div className="video-ad-badge">
          <span className="ad-label">Ad</span>
          <span className="ad-time-remaining">
            {Math.ceil((ad.duration || 15) - (videoRef.current?.currentTime || 0))}s
          </span>
        </div>

        {/* Skip Button */}
        <div className="video-ad-skip-container">
          {canSkip ? (
            <button 
              className="video-ad-skip-btn"
              onClick={handleSkip}
            >
              Skip Ad →
            </button>
          ) : (
            <div className="video-ad-skip-countdown">
              Skip in {skipCountdown}s
            </div>
          )}
        </div>

        {/* Ad Info */}
        <div className="video-ad-info" onClick={handleAdClick}>
          <div className="video-ad-title">{ad.title}</div>
          <div className="video-ad-advertiser">{ad.advertiser}</div>
          <button className="video-ad-cta">Visit Advertiser →</button>
        </div>

        {/* Progress Bar */}
        <div className="video-ad-progress-bar">
          <div 
            className="video-ad-progress-fill"
            style={{ width: `${adProgress}%` }}
          />
        </div>
      </div>

      <video
        ref={videoRef}
        src={ad.videoUrl}
        className="video-ad-player"
        autoPlay
        onEnded={handleVideoEnd}
        onTimeUpdate={handleTimeUpdate}
        controls={false}
      />
    </div>
  );
};

export default VideoAd;
