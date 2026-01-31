/**
 * Schedule Metrics Panel
 * Displays health check information and recommendations
 */

import React from 'react';
import type { ScheduleHealthCheck } from '../../types/scheduleAPI';
import './ScheduleMetricsPanel.css';

interface ScheduleMetricsPanelProps {
  health: ScheduleHealthCheck;
}

export const ScheduleMetricsPanel: React.FC<ScheduleMetricsPanelProps> = ({ health }) => {
  const getHealthColor = (score: number) => {
    if (score >= 85) return '#4caf50'; // Green
    if (score >= 70) return '#8bc34a'; // Light green
    if (score >= 50) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getHealthText = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="schedule-metrics-panel">
      <h3>Schedule Health</h3>

      <div className="health-score-container">
        <div className="health-gauge">
          <svg viewBox="0 0 100 100" className="gauge">
            <circle cx="50" cy="50" r="45" className="gauge-background" />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="gauge-foreground"
              style={{
                strokeDasharray: `${(health.overall_score / 100) * 282.7} 282.7`,
              }}
            />
            <text x="50" y="50" className="gauge-text">
              {health.overall_score.toFixed(0)}
            </text>
          </svg>
        </div>
        <div className="health-info">
          <p className="health-status" style={{ color: getHealthColor(health.overall_score) }}>
            {getHealthText(health.overall_score)}
          </p>
          <p className="health-message">{health.status}</p>
        </div>
      </div>

      <div className="health-metrics">
        <div className="metric">
          <label>Quality Score</label>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(health.overall_score, 100)}%` }}
            ></div>
          </div>
          <span>{health.overall_score.toFixed(1)}/100</span>
        </div>

        <div className="metric">
          <label>Assignment Match Quality</label>
          <span>{health.average_match_score?.toFixed(1) || 'N/A'}%</span>
        </div>

        <div className="metric">
          <label>Workload Balance</label>
          <span>{health.workload_balance_score?.toFixed(1) || 'N/A'}%</span>
        </div>

        <div className="metric">
          <label>Constraint Violations</label>
          <span>{health.constraint_violations || 0}</span>
        </div>
      </div>

      {health.concerns && health.concerns.length > 0 && (
        <div className="health-concerns">
          <h4>⚠️ Concerns ({health.concerns.length})</h4>
          <ul>
            {health.concerns.map((concern, idx) => (
              <li key={idx}>{concern}</li>
            ))}
          </ul>
        </div>
      )}

      {health.recommendations && health.recommendations.length > 0 && (
        <div className="health-recommendations">
          <h4>💡 Recommendations ({health.recommendations.length})</h4>
          <ul>
            {health.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
