/**
 * Connection Status Component
 * Banner displaying WebSocket connection state and metrics
 */

import React from 'react';
import './ConnectionStatus.scss';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  error?: string | null;
  latency?: number;
  socketId?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  error,
  latency,
  socketId,
}) => {
  if (!isConnected && !isConnecting && !error) {
    return null; // Don't show banner if disconnected without attempting connection
  }

  const getStatusClass = () => {
    if (error) return 'error';
    if (isConnecting) return 'connecting';
    if (isConnected) {
      if (latency === undefined) return 'connected';
      if (latency < 100) return 'excellent';
      if (latency < 300) return 'good';
      if (latency < 1000) return 'fair';
      return 'poor';
    }
    return 'disconnected';
  };

  const getStatusIcon = () => {
    if (error) return '⚠️';
    if (isConnecting) return '⏳';
    if (isConnected) return '✓';
    return '✗';
  };

  const getStatusMessage = () => {
    if (error) return `Connection Error: ${error}`;
    if (isConnecting) return 'Connecting to real-time updates...';
    if (isConnected) {
      if (latency !== undefined) {
        return `Connected (${latency}ms latency)`;
      }
      return 'Connected to real-time updates';
    }
    return 'Disconnected from real-time updates';
  };

  const getLatencyQuality = () => {
    if (!isConnected || latency === undefined) return null;
    if (latency < 100) return 'Excellent';
    if (latency < 300) return 'Good';
    if (latency < 1000) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`connection-status ${getStatusClass()}`}>
      <div className="status-content">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-message">{getStatusMessage()}</span>
        
        {isConnected && latency !== undefined && (
          <div className="connection-metrics">
            <span className="metric-item">
              <span className="metric-label">Quality:</span>
              <span className="metric-value">{getLatencyQuality()}</span>
            </span>
            {socketId && (
              <span className="metric-item socket-id">
                <span className="metric-label">ID:</span>
                <span className="metric-value">{socketId.substring(0, 8)}...</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
