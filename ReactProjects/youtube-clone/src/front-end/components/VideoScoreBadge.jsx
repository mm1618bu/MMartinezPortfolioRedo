/**
 * VideoScoreBadge Component
 * Displays video score and health indicators
 * Useful for content creators to see how their videos are performing
 */

import React from 'react';
import { calculateVideoHealth, calculateVideoScore } from '../utils/videoScoringSystem';

export default function VideoScoreBadge({ video, showDetails = false, size = 'small' }) {
  if (!video) return null;

  const health = calculateVideoHealth(video);
  const score = showDetails ? calculateVideoScore(video) : null;

  const healthColors = {
    excellent: '#10b981',
    good: '#3b82f6',
    average: '#f59e0b',
    new: '#8b5cf6',
    'needs-improvement': '#ef4444',
  };

  const healthLabels = {
    excellent: '🌟 Excellent',
    good: '👍 Good',
    average: '📊 Average',
    new: '🆕 New',
    'needs-improvement': '📉 Needs Work',
  };

  const sizes = {
    small: { fontSize: '11px', padding: '2px 6px' },
    medium: { fontSize: '13px', padding: '4px 8px' },
    large: { fontSize: '14px', padding: '6px 12px' },
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: healthColors[health.status],
    color: 'white',
    borderRadius: '4px',
    fontWeight: '600',
    ...sizes[size],
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <div style={badgeStyle} title={`Score: ${health.score.toFixed(1)}/100`}>
        {healthLabels[health.status]}
      </div>
      
      {showDetails && score && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '4px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span title="Engagement (likes, views)">
            📊 {score.breakdown.engagement.toFixed(0)}
          </span>
          <span title="Recency (how new)">
            ⏰ {score.breakdown.recency.toFixed(0)}
          </span>
          <span title="Quality (resolution)">
            🎬 {score.breakdown.quality.toFixed(0)}
          </span>
          {score.breakdown.keyword > 0 && (
            <span title="Keyword match">
              🔑 {score.breakdown.keyword.toFixed(0)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
