/**
 * Schedule Legend Component
 * Displays color coding and status explanations for the schedule grid
 */

import React, { useState } from 'react';
import './ScheduleLegend.css';

export const ScheduleLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`schedule-legend ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="legend-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '▶'} Legend
      </button>

      {isExpanded && (
        <div className="legend-content">
          <div className="legend-section">
            <h4>Assignment Status</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color status-proposed"></span>
                <label>Proposed</label>
              </div>
              <div className="legend-item">
                <span className="legend-color status-assigned"></span>
                <label>Assigned</label>
              </div>
              <div className="legend-item">
                <span className="legend-color status-confirmed"></span>
                <label>Confirmed</label>
              </div>
              <div className="legend-item">
                <span className="legend-color status-active"></span>
                <label>Active</label>
              </div>
              <div className="legend-item">
                <span className="legend-color status-completed"></span>
                <label>Completed</label>
              </div>
              <div className="legend-item">
                <span className="legend-color status-cancelled"></span>
                <label>Cancelled</label>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <h4>Quality & Issues</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-icon">⚠️</span>
                <label>Constraint Violation</label>
              </div>
              <div className="legend-item">
                <span className="legend-icon">📌</span>
                <label>Locked / Pinned</label>
              </div>
              <div className="legend-item">
                <span className="legend-icon">✓</span>
                <label>Confirmed by Employee</label>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <h4>Health Score</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge health-excellent">85+</span>
                <label>Excellent</label>
              </div>
              <div className="legend-item">
                <span className="legend-badge health-good">70-84</span>
                <label>Good</label>
              </div>
              <div className="legend-item">
                <span className="legend-badge health-fair">50-69</span>
                <label>Fair</label>
              </div>
              <div className="legend-item">
                <span className="legend-badge health-poor">&lt;50</span>
                <label>Poor</label>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <h4>Tips</h4>
            <ul className="legend-tips">
              <li>Click on a cell to view assignment details</li>
              <li>Use filters to focus on specific employees or statuses</li>
              <li>Check the health metrics panel for schedule quality insights</li>
              <li>Review recommendations for schedule improvements</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
