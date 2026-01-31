/**
 * Schedule Grid Header
 * Displays schedule metadata, status, and quality metrics
 */

import React from 'react';
import type { Schedule, ScheduleHealthCheck } from '../../types/scheduleAPI';
import './ScheduleGridHeader.css';

interface ScheduleGridHeaderProps {
  schedule: Schedule;
  health: ScheduleHealthCheck | null;
}

export const ScheduleGridHeader: React.FC<ScheduleGridHeaderProps> = ({ schedule, health }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-${status.toLowerCase()}`;
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  return (
    <div className="schedule-grid-header">
      <div className="header-top">
        <div className="header-title">
          <h2>{schedule.name}</h2>
          <p className="subtitle">{schedule.description}</p>
        </div>
        <div className="header-status">
          <span className={getStatusBadgeClass(schedule.status)}>{schedule.status}</span>
          {schedule.is_locked && (
            <span className="locked-badge">
              🔒 Locked
            </span>
          )}
        </div>
      </div>

      <div className="header-metrics">
        <div className="metric-group">
          <div className="metric-item">
            <label>Date Range</label>
            <span className="metric-value">
              {formatDate(schedule.schedule_start_date)} - {formatDate(schedule.schedule_end_date)}
            </span>
          </div>
          <div className="metric-item">
            <label>Version</label>
            <span className="metric-value">v{schedule.version}</span>
          </div>
          <div className="metric-item">
            <label>Algorithm</label>
            <span className="metric-value">{schedule.algorithm}</span>
          </div>
        </div>

        <div className="metric-group">
          <div className="metric-item">
            <label>Coverage</label>
            <span className="metric-value">{schedule.coverage_percentage}%</span>
          </div>
          <div className="metric-item">
            <label>Assigned / Total</label>
            <span className="metric-value">
              {schedule.assigned_shifts} / {schedule.total_shifts}
            </span>
          </div>
          <div className="metric-item">
            <label>Quality Score</label>
            <span className={`metric-value score-${getHealthColor(schedule.quality_score || 0)}`}>
              {schedule.quality_score?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>

        {health && (
          <div className="metric-group health-group">
            <div className="metric-item">
              <label>Health Status</label>
              <span className={`health-status ${getHealthColor(health.overall_score)}`}>
                {health.status}
              </span>
            </div>
            <div className="metric-item">
              <label>Issues</label>
              <span className="metric-value">{health.concerns?.length || 0} concern(s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
