/**
 * Live Dashboard Component
 * Example component demonstrating WebSocket integration for real-time updates
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  useWebSocket,
  useKPIUpdates,
  useAlertNotifications,
  useBacklogUpdates,
  useWebSocketHealth,
} from '../hooks/useWebSocket';
import type {
  KPIUpdatePayload,
  AlertUpdatePayload,
  BacklogUpdatePayload,
} from '../../api/types/websocket';
import './LiveDashboard.scss';

interface LiveDashboardProps {
  userId: string;
  organizationId: string;
  departmentId?: string;
  queueName?: string;
}

const LiveDashboard: React.FC<LiveDashboardProps> = ({
  userId,
  organizationId,
  departmentId,
  queueName,
}) => {
  // WebSocket connection
  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    error: connectionError,
    authenticate,
    socketId,
  } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
    autoConnect: true,
    autoAuthenticate: true,
    userId,
    organizationId,
  });

  // Connection health monitoring
  const { latency, lastPingTime } = useWebSocketHealth(30000); // Ping every 30s

  // State for real-time data
  const [currentKPIs, setCurrentKPIs] = useState<KPIUpdatePayload | null>(null);
  const [currentBacklog, setCurrentBacklog] = useState<BacklogUpdatePayload | null>(null);

  // KPI updates handler
  const handleKPIUpdate = useCallback((payload: KPIUpdatePayload) => {
    console.log('KPI update received:', payload);
    setCurrentKPIs(payload);
  }, []);

  // Alert handler
  const handleAlert = useCallback((payload: AlertUpdatePayload) => {
    console.log('Alert received:', payload);
    // Could show toast notification here
  }, []);

  // Backlog updates handler
  const handleBacklogUpdate = useCallback((payload: BacklogUpdatePayload) => {
    console.log('Backlog update received:', payload);
    setCurrentBacklog(payload);
  }, []);

  // Subscribe to real-time updates
  useKPIUpdates(handleKPIUpdate, {
    organization_id: organizationId,
    department_id: departmentId,
    queue_name: queueName,
  });

  useAlertNotifications(handleAlert, {
    organization_id: organizationId,
    department_id: departmentId,
    queue_name: queueName,
  });

  useBacklogUpdates(handleBacklogUpdate, {
    organization_id: organizationId,
    department_id: departmentId,
    queue_name: queueName,
  });

  // Authenticate manually if auto-auth failed
  useEffect(() => {
    if (isConnected && !isAuthenticated && !connectionError) {
      authenticate(userId, organizationId).catch(console.error);
    }
  }, [isConnected, isAuthenticated, userId, organizationId, authenticate, connectionError]);

  return (
    <div className="live-dashboard">
      <div className="dashboard-header">
        <h1>Live Operations Dashboard</h1>
        
        {/* Connection Status */}
        <div className={`connection-status status-${connectionStatus}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
            {connectionStatus === 'reconnecting' && 'Reconnecting...'}
            {connectionStatus === 'error' && 'Error'}
          </span>
          {latency !== null && (
            <span className="latency">{latency}ms</span>
          )}
        </div>
      </div>

      {/* Connection Info */}
      {connectionError && (
        <div className="error-banner">
          <strong>Connection Error:</strong> {connectionError.message}
        </div>
      )}

      {isConnected && isAuthenticated && (
        <div className="connection-info">
          <div className="info-item">
            <span className="label">Socket ID:</span>
            <span className="value">{socketId}</span>
          </div>
          <div className="info-item">
            <span className="label">Last Ping:</span>
            <span className="value">
              {lastPingTime ? lastPingTime.toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Live KPI Display */}
      {currentKPIs && (
        <div className="kpi-section">
          <h2>Live KPIs</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Utilization</div>
              <div className="kpi-value">
                {(currentKPIs.utilization.current_utilization * 100).toFixed(1)}%
              </div>
              <div className={`kpi-change ${(currentKPIs.changes?.utilization_change ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                {(currentKPIs.changes?.utilization_change ?? 0) > 0 ? '+' : ''}
                {((currentKPIs.changes?.utilization_change ?? 0) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Headcount Gap</div>
              <div className="kpi-value">
                {currentKPIs.headcount_gap.headcount_gap > 0 ? 'Over' : 'Under'} by{' '}
                {Math.abs(currentKPIs.headcount_gap.headcount_gap)}
              </div>
              <div className="kpi-status">{currentKPIs.headcount_gap.staffing_level}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">SLA Risk</div>
              <div className={`kpi-value risk-${currentKPIs.sla_risk.risk_level.toLowerCase()}`}>
                {currentKPIs.sla_risk.risk_score.toFixed(1)}
              </div>
              <div className="kpi-status">{currentKPIs.sla_risk.risk_level}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Health Score</div>
              <div className="kpi-value">
                {currentKPIs.health_score.toFixed(0)}
              </div>
              <div className="kpi-status">
                {currentKPIs.health_score >= 80 ? 'Healthy' :
                 currentKPIs.health_score >= 60 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>

          <div className="kpi-timestamp">
            Last updated: {new Date(currentKPIs.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Live Backlog Display */}
      {currentBacklog && (
        <div className="backlog-section">
          <h2>Live Backlog</h2>
          <div className="backlog-stats">
            <div className="stat-item">
              <span className="label">Total Items:</span>
              <span className="value">{currentBacklog.total_items}</span>
            </div>
            <div className="stat-item">
              <span className="label">Avg Wait Time:</span>
              <span className="value">{currentBacklog.avg_wait_time_minutes.toFixed(1)} min</span>
            </div>
            <div className="stat-item">
              <span className="label">SLA at Risk:</span>
              <span className="value">{currentBacklog.items_over_sla}</span>
            </div>
            <div className="stat-item">
              <span className="label">Queue:</span>
              <span className="value">
                {currentBacklog.queue_name}
              </span>
            </div>
          </div>

          <div className="backlog-timestamp">
            Last updated: {new Date(currentBacklog.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && (
        <div className="status-message">
          <p>Connecting to real-time updates...</p>
        </div>
      )}

      {isConnected && !isAuthenticated && (
        <div className="status-message">
          <p>Authenticating...</p>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;
