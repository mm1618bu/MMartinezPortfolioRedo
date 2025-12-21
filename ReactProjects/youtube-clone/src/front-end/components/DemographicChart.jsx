// src/front-end/components/DemographicChart.jsx
import React from 'react';

/**
 * Simple bar chart component for demographic data visualization
 */
export default function DemographicChart({ data, title, color = '#1976d2', maxItems = 5 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#999',
        border: '1px dashed #ddd',
        borderRadius: '8px'
      }}>
        No data available
      </div>
    );
  }

  const displayData = data.slice(0, maxItems);
  const maxCount = Math.max(...displayData.map(item => item.count));

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e0e0e0'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#333'
      }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayData.map((item, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <span style={{ fontWeight: '500', color: '#555' }}>
                {item.label}
              </span>
              <span style={{ color: '#777' }}>
                {item.count.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
