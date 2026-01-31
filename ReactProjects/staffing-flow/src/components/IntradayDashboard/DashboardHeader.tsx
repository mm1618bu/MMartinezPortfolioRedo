/**
 * Dashboard Header Component
 * Header bar with controls and overall status
 */

import React from 'react';
import './DashboardHeader.scss';

interface DashboardHeaderProps {
  siteName?: string;
  queueName?: string;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
  onRefresh?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  siteName,
  queueName,
  overallHealth,
  timeRange,
  onTimeRangeChange,
  autoRefresh,
  onAutoRefreshToggle,
  onRefresh,
}) => {
  const getHealthIcon = () => {
    switch (overallHealth) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🟡';
      case 'warning':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getHealthLabel = () => {
    return overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1);
  };

  return (
    <div className="dashboard-header">
      <div className="header-left">
        <h1 className="dashboard-title">Intraday Console</h1>
        {(siteName || queueName) && (
          <div className="dashboard-context">
            {siteName && <span className="context-item site">{siteName}</span>}
            {queueName && <span className="context-item queue">{queueName}</span>}
          </div>
        )}
      </div>

      <div className="header-center">
        <div className={`overall-health health-${overallHealth}`}>
          <span className="health-icon">{getHealthIcon()}</span>
          <span className="health-label">{getHealthLabel()}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="control-group time-range">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => onTimeRangeChange(e.target.value)}>
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="8h">Last 8 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>

        <div className="control-group auto-refresh">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={onAutoRefreshToggle}
            />
            <span className="toggle-switch" />
            <span className="toggle-text">Auto-Refresh</span>
          </label>
        </div>

        {onRefresh && (
          <button className="refresh-button" onClick={onRefresh} title="Refresh Now">
            🔄
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
