/**
 * AdAnalyticsDashboard Component
 * Displays ad performance metrics and analytics
 */

import React, { useState, useEffect } from 'react';
import { getAdAnalytics, resetAdAnalytics } from '../utils/adSimulationEngine';

const AdAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    revenue: 0,
    rpm: 0
  });

  const refreshAnalytics = () => {
    const data = getAdAnalytics();
    setAnalytics(data);
  };

  useEffect(() => {
    refreshAnalytics();
    
    // Refresh every 2 seconds
    const interval = setInterval(refreshAnalytics, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (window.confirm('Reset all ad analytics? This cannot be undone.')) {
      resetAdAnalytics();
      refreshAnalytics();
    }
  };

  return (
    <div className="ad-analytics-dashboard">
      <div className="ad-analytics-header">
        <h2>Ad Performance Dashboard</h2>
        <button onClick={handleReset} className="analytics-reset-btn">
          Reset Analytics
        </button>
      </div>

      <div className="ad-analytics-grid">
        {/* Impressions Card */}
        <div className="analytics-card">
          <div className="analytics-card-icon">👁️</div>
          <div className="analytics-card-content">
            <div className="analytics-card-value">{analytics.impressions}</div>
            <div className="analytics-card-label">Total Impressions</div>
          </div>
        </div>

        {/* Clicks Card */}
        <div className="analytics-card">
          <div className="analytics-card-icon">🎯</div>
          <div className="analytics-card-content">
            <div className="analytics-card-value">{analytics.clicks}</div>
            <div className="analytics-card-label">Total Clicks</div>
          </div>
        </div>

        {/* CTR Card */}
        <div className="analytics-card">
          <div className="analytics-card-icon">📊</div>
          <div className="analytics-card-content">
            <div className="analytics-card-value">{analytics.ctr}%</div>
            <div className="analytics-card-label">Click-Through Rate</div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="analytics-card highlight">
          <div className="analytics-card-icon">💰</div>
          <div className="analytics-card-content">
            <div className="analytics-card-value">${analytics.revenue}</div>
            <div className="analytics-card-label">Total Revenue</div>
          </div>
        </div>

        {/* RPM Card */}
        <div className="analytics-card">
          <div className="analytics-card-icon">📈</div>
          <div className="analytics-card-content">
            <div className="analytics-card-value">${analytics.rpm}</div>
            <div className="analytics-card-label">Revenue per 1K Impressions</div>
          </div>
        </div>
      </div>

      <div className="ad-analytics-info">
        <p>
          💡 <strong>Tip:</strong> This is a simulation. In production, ad data would come from 
          a real ad network like Google AdSense, with actual campaigns and targeting.
        </p>
      </div>
    </div>
  );
};

export default AdAnalyticsDashboard;
