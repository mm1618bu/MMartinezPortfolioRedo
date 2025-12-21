/**
 * BannerAd Component
 * Displays banner advertisements in the feed
 */

import React, { useEffect } from 'react';
import { adTargetingEngine } from '../utils/adSimulationEngine';

const BannerAd = ({ ad, onClose }) => {
  useEffect(() => {
    if (ad) {
      // Track impression when ad is displayed
      adTargetingEngine.trackImpression(ad);
    }
  }, [ad]);

  if (!ad) return null;

  const handleClick = () => {
    adTargetingEngine.trackClick(ad);
    // Open advertiser link in new tab
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="banner-ad-container">
      <div className="banner-ad-label">
        <span className="ad-badge">Ad</span>
        <span className="ad-advertiser">{ad.advertiser}</span>
        {onClose && (
          <button 
            className="ad-close-btn"
            onClick={onClose}
            aria-label="Close ad"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="banner-ad-content" onClick={handleClick}>
        <img 
          src={ad.imageUrl} 
          alt={ad.title}
          className="banner-ad-image"
        />
        <div className="banner-ad-info">
          <h3 className="banner-ad-title">{ad.title}</h3>
          <p className="banner-ad-description">{ad.description}</p>
          <button className="banner-ad-cta">Learn More →</button>
        </div>
      </div>
    </div>
  );
};

export default BannerAd;
