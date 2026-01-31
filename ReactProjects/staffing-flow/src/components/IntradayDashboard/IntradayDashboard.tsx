/**
 * Intraday Dashboard - Main Container
 * Real-time operational monitoring dashboard
 */

import React, { useState, useMemo } from 'react';
import {
  useWebSocket,
  useKPIUpdates,
  useBacklogUpdates,
  useAttendanceUpdates,
  useAlertNotifications,
  useWebSocketHealth,
} from '../../hooks/useWebSocket';
import KPIWidget from './KPIWidget';
import BacklogWidget from './BacklogWidget';
import AttendanceWidget from './AttendanceWidget';
import AlertPanel from './AlertPanel';
import ConnectionStatus from './ConnectionStatus';
import DashboardHeader from './DashboardHeader';
import RecommendedActions from './RecommendedActions';
import type {
  KPIUpdatePayload,
  BacklogUpdatePayload,
  AttendanceUpdatePayload,
  AlertUpdatePayload,
} from '../../../api/types/websocket';
import './IntradayDashboard.scss';

interface IntradayDashboardProps {
  userId: string;
  organizationId: string;
  departmentId?: string;
  queueName?: string;
  siteName?: string;
}

const IntradayDashboard: React.FC<IntradayDashboardProps> = ({
  userId,
  organizationId,
  departmentId,
  queueName,
  siteName = 'Operations Center',
}) => {
  // WebSocket connection
  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    error: connectionError,
    socketId,
  } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
    autoConnect: true,
    autoAuthenticate: true,
    userId,
    organizationId,
  });

  // Connection health
  const { latency } = useWebSocketHealth(30000);

  // Real-time data state
  const [currentKPIs, setCurrentKPIs] = useState<KPIUpdatePayload | null>(null);
  const [currentBacklog, setCurrentBacklog] = useState<BacklogUpdatePayload | null>(null);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceUpdatePayload | null>(null);
  const [alerts, setAlerts] = useState<AlertUpdatePayload[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // Subscribe to real-time updates
  useKPIUpdates(
    (payload) => {
      setCurrentKPIs(payload);
    },
    {
      organization_id: organizationId,
      department_id: departmentId,
      queue_name: queueName,
    }
  );

  useBacklogUpdates(
    (payload) => {
      setCurrentBacklog(payload);
    },
    {
      organization_id: organizationId,
      department_id: departmentId,
      queue_name: queueName,
    }
  );

  useAttendanceUpdates(
    (payload) => {
      setCurrentAttendance(payload);
    },
    {
      organization_id: organizationId,
      department_id: departmentId,
    }
  );

  const { latestAlert, alertCount } = useAlertNotifications(
    (alert) => {
      // Add to alerts list
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]); // Keep last 50
      
      // Auto-show panel for critical alerts
      if (alert.severity === 'critical') {
        setShowAlertPanel(true);
      }
    },
    {
      organization_id: organizationId,
      department_id: departmentId,
      queue_name: queueName,
    }
  );

  // Calculate overall health status
  const overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = useMemo(() => {
    if (!currentKPIs) return 'warning';
    
    const healthScore = currentKPIs.health_score;
    if (healthScore >= 85) return 'excellent';
    if (healthScore >= 70) return 'good';
    if (healthScore >= 50) return 'warning';
    return 'critical';
  }, [currentKPIs]);

  // Filter state
  const [timeRange, setTimeRange] = useState<'1h' | '4h' | '8h' | '24h'>('4h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="intraday-dashboard">
      {/* Header */}
      <DashboardHeader
        siteName={siteName}
        queueName={queueName}
        timeRange={timeRange}
        onTimeRangeChange={(range) => setTimeRange(range as '1h' | '4h' | '8h' | '24h')}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
        overallHealth={overallHealth}
      />

      {/* Connection Status Banner */}
      <ConnectionStatus
        isConnected={isConnected}
        error={connectionError?.message || null}
        latency={latency || undefined}
        socketId={socketId || undefined}
      />

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* KPI Section */}
        <div className="dashboard-section kpi-section">
          <h2 className="section-title">Live KPIs</h2>
          <div className="kpi-grid">
            <KPIWidget
              type="utilization"
              data={currentKPIs}
              isLoading={!currentKPIs && isConnected}
            />
            <KPIWidget
              type="headcount"
              data={currentKPIs}
              isLoading={!currentKPIs && isConnected}
            />
            <KPIWidget
              type="sla"
              data={currentKPIs}
              isLoading={!currentKPIs && isConnected}
            />
            <KPIWidget
              type="health"
              data={currentKPIs}
              isLoading={!currentKPIs && isConnected}
            />
          </div>
        </div>

        {/* Backlog Section */}
        <div className="dashboard-section backlog-section">
          <h2 className="section-title">Backlog Monitor</h2>
          <BacklogWidget
            data={currentBacklog}
            isLoading={!currentBacklog && isConnected}
          />
        </div>

        {/* Attendance Section */}
        <div className="dashboard-section attendance-section">
          <h2 className="section-title">Attendance</h2>
          <AttendanceWidget
            data={currentAttendance}
            isLoading={!currentAttendance && isConnected}
          />
        </div>

        {/* Recommended Actions Section */}
        <div className="dashboard-section recommendations-section">
          <RecommendedActions
            kpiData={currentKPIs}
            backlogData={currentBacklog}
            attendanceData={currentAttendance}
            onActionTaken={(actionId, actionType) => {
              console.log(`Action taken: ${actionId} - ${actionType}`);
              // In production, this would trigger actual action handlers
            }}
            onActionDismissed={(actionId) => {
              console.log(`Action dismissed: ${actionId}`);
            }}
          />
        </div>

        {/* Alert Section */}
        <div className="dashboard-section alert-section">
          <div className="section-header">
            <h2 className="section-title">
              Active Alerts
              {alertCount > 0 && (
                <span className="alert-badge">{alertCount}</span>
              )}
            </h2>
            <button
              className="toggle-alert-panel"
              onClick={() => setShowAlertPanel(!showAlertPanel)}
            >
              {showAlertPanel ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {latestAlert && (
            <div className={`latest-alert severity-${latestAlert.severity}`}>
              <div className="alert-header">
                <span className="alert-icon">⚠️</span>
                <span className="alert-title">{latestAlert.message}</span>
              </div>
              <div className="alert-meta">
                <span className="alert-time">
                  {new Date(latestAlert.timestamp).toLocaleTimeString()}
                </span>
                {latestAlert.queue_name && (
                  <span className="alert-queue">{latestAlert.queue_name}</span>
                )}
              </div>
            </div>
          )}

          {alertCount === 0 && !latestAlert && (
            <div className="no-alerts">
              <span className="checkmark">✓</span>
              <p>All systems operating normally</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Panel (Slide-out) */}
      <AlertPanel
        alerts={alerts}
        isOpen={showAlertPanel}
        onClose={() => setShowAlertPanel(false)}
      />

      {/* Disconnected Overlay */}
      {!isConnected && (
        <div className="disconnected-overlay">
          <div className="disconnected-message">
            <div className="spinner"></div>
            <h3>Connecting to real-time updates...</h3>
            <p>
              {connectionStatus === 'reconnecting'
                ? 'Attempting to reconnect...'
                : 'Establishing connection...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntradayDashboard;
