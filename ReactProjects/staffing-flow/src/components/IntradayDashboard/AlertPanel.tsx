/**
 * Alert Panel Component
 * Slide-out panel displaying alert history with filtering and actions
 */

import React, { useState, useMemo } from 'react';
import type { AlertUpdatePayload } from '../../../api/types/websocket';
import './AlertPanel.scss';

interface AlertPanelProps {
  alerts: AlertUpdatePayload[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  isOpen,
  onClose,
  onAcknowledge,
  onResolve,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterSeverity && alert.severity !== filterSeverity) return false;
      if (filterStatus && alert.status !== filterStatus) return false;
      return true;
    });
  }, [alerts, filterSeverity, filterStatus]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'error':
        return '🟠';
      case 'warning':
        return '🟡';
      case 'info':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'New';
      case 'active':
        return 'Active';
      case 'acknowledged':
        return 'Acknowledged';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  return (
    <>
      {isOpen && <div className="alert-panel-backdrop" onClick={onClose} />}
      <div className={`alert-panel ${isOpen ? 'open' : ''}`}>
        <div className="alert-panel-header">
          <h2>Alerts ({filteredAlerts.length})</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="alert-panel-filters">
          <div className="filter-group">
            <label>Severity:</label>
            <select
              value={filterSeverity || ''}
              onChange={(e) => setFilterSeverity(e.target.value || null)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
            >
              <option value="">All</option>
              <option value="pending">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="alert-list">
          {filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <p>No alerts match the current filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`alert-item severity-${alert.severity} status-${alert.status}`}
              >
                <div className="alert-header">
                  <span className="severity-icon">
                    {getSeverityIcon(alert.severity)}
                  </span>
                  <span className="alert-rule">{alert.alert_type}</span>
                  <span className={`alert-status status-${alert.status}`}>
                    {getStatusLabel(alert.status)}
                  </span>
                </div>

                <div className="alert-message">{alert.message}</div>

                <div className="alert-details">
                  {alert.current_value !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Current:</span>
                      <strong>{alert.current_value}</strong>
                    </div>
                  )}
                  {alert.threshold_value !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Threshold:</span>
                      <strong>{alert.threshold_value}</strong>
                    </div>
                  )}
                  {alert.queue_name && (
                    <div className="detail-item">
                      <span className="detail-label">Queue:</span>
                      <strong>{alert.queue_name}</strong>
                    </div>
                  )}
                  {alert.source && (
                    <div className="detail-item">
                      <span className="detail-label">Source:</span>
                      <strong>{alert.source}</strong>
                    </div>
                  )}
                </div>

                <div className="alert-timestamps">
                  <div className="timestamp-item">
                    <span className="timestamp-label">Timestamp:</span>
                    <span className="timestamp-value">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {alert.status === 'pending' && (
                  <div className="alert-actions">
                    {onAcknowledge && (
                      <button
                        className="action-button acknowledge"
                        onClick={() => onAcknowledge(alert.alert_id)}
                      >
                        Acknowledge
                      </button>
                    )}
                    {onResolve && (
                      <button
                        className="action-button resolve"
                        onClick={() => onResolve(alert.alert_id)}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}

                {alert.status === 'acknowledged' && onResolve && (
                  <div className="alert-actions">
                    <button
                      className="action-button resolve"
                      onClick={() => onResolve(alert.alert_id)}
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default AlertPanel;
