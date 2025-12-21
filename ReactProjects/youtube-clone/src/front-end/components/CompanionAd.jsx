/**
 * CompanionAd Component
 * Displays companion ads in sidebar next to video player
 */

import React, { useEffect } from 'react';
import { adTargetingEngine } from '../utils/adSimulationEngine';

const CompanionAd = ({ ad }) => {
  useEffect(() => {
    if (ad) {
      // Track impression when ad is displayed
      adTargetingEngine.trackImpression(ad);
    }
  }, [ad]);

  if (!ad) return null;

  const handleClick = () => {
    adTargetingEngine.trackClick(ad);
    window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="companion-ad-container">
      <div className="companion-ad-label">
        <span className="ad-badge">Sponsored</span>
      </div>
      
      <div className="companion-ad-content" onClick={handleClick}>
        <img 
          src={ad.imageUrl} 
          alt={ad.title}
          className="companion-ad-image"
        />
        <div className="companion-ad-info">
          <h4 className="companion-ad-title">{ad.title}</h4>
          <p className="companion-ad-description">{ad.description}</p>
          <div className="companion-ad-advertiser">
            by {ad.advertiser}
          </div>
          <button className="companion-ad-cta">Learn More</button>
        </div>
      </div>
    </div>
  );
};

export default CompanionAd;
