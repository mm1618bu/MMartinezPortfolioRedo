/**
 * Backlog Widget Component
 * Displays real-time backlog metrics and trends
 */

import React from 'react';
import type { BacklogUpdatePayload } from '../../../api/types/websocket';
import './BacklogWidget.scss';

interface BacklogWidgetProps {
  data: BacklogUpdatePayload | null;
  isLoading?: boolean;
}

const BacklogWidget: React.FC<BacklogWidgetProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="backlog-widget loading">
        <div className="skeleton-loader large"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="backlog-widget no-data">
        <p>No backlog data available</p>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (data.backlog_trend) {
      case 'growing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendClass = () => {
    switch (data.backlog_trend) {
      case 'growing':
        return 'trend-up';
      case 'decreasing':
        return 'trend-down';
      default:
        return 'trend-stable';
    }
  };

  return (
    <div className="backlog-widget">
      <div className="backlog-summary">
        <div className="metric-card primary">
          <div className="metric-label">Total Items</div>
          <div className="metric-value">{data.total_items}</div>
          <div className={`metric-trend ${getTrendClass()}`}>
            <span className="trend-icon">{getTrendIcon()}</span>
            <span className="trend-label">{data.backlog_trend}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Wait Time</div>
          <div className="metric-value">
            {data.avg_wait_time_minutes.toFixed(0)}
            <span className="metric-unit">min</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-label">Items Over SLA</div>
          <div className="metric-value">{data.items_over_sla}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">SLA Compliance</div>
          <div className="metric-value">
            {data.sla_compliance_percentage.toFixed(1)}
            <span className="metric-unit">%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${data.sla_compliance_percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="backlog-activity">
        <h4>Recent Activity</h4>
        <div className="activity-stats">
          <div className="activity-item">
            <span className="activity-icon added">+</span>
            <span className="activity-label">Added</span>
            <span className="activity-value">{data.items_added_this_interval}</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon completed">✓</span>
            <span className="activity-label">Completed</span>
            <span className="activity-value">{data.items_completed_this_interval}</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon net">
              {data.items_added_this_interval > data.items_completed_this_interval ? '↑' : '↓'}
            </span>
            <span className="activity-label">Net Change</span>
            <span className="activity-value">
              {data.items_added_this_interval - data.items_completed_this_interval}
            </span>
          </div>
        </div>
      </div>

      <div className="backlog-footer">
        <span className="queue-label">
          {data.queue_name && `Queue: ${data.queue_name}`}
        </span>
        <span className="last-update">
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default BacklogWidget;
