/**
 * Database Health Check Component
 * Displays database connection status and diagnostics
 */

import React, { useEffect, useState } from 'react';
import { runFullHealthCheck } from '../../lib/database-health-check';
import { runDiagnostics, type DiagnosticResult } from '../../lib/database-diagnostics';
import './DatabaseHealthCheck.css';

interface HealthCheckData {
  connection: any;
  schema: any;
  stats: any;
  healthy: boolean;
  timestamp: string;
}

export const DatabaseHealthCheck: React.FC = () => {
  const [healthCheck, setHealthCheck] = useState<HealthCheckData | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const [healthResult, diagResult] = await Promise.all([
          runFullHealthCheck(),
          runDiagnostics(),
        ]);
        setHealthCheck({
          ...healthResult,
          timestamp: new Date().toISOString(),
        });
        setDiagnostics(diagResult);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        setHealthCheck(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const [healthResult, diagResult] = await Promise.all([
        runFullHealthCheck(),
        runDiagnostics(),
      ]);
      setHealthCheck({
        ...healthResult,
        timestamp: new Date().toISOString(),
      });
      setDiagnostics(diagResult);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="database-health-check">
      <div className="health-check-header">
        <h2>🗄️ Database Health Check</h2>
        <div className="header-buttons">
          <button 
            className={`btn-diagnostics ${showDiagnostics ? 'active' : ''}`} 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            disabled={loading}
          >
            🔍 Diagnostics
          </button>
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Checking...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {loading && <div className="loading">Checking database connection...</div>}

      {error && <div className="error-message">Error: {error}</div>}

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics && (
        <div className="diagnostics-panel">
          <h3>🔍 Diagnostics Report</h3>

          {/* Environment Variables */}
          <div className="diag-section">
            <h4>Environment Variables</h4>
            <div className={`diag-item ${diagnostics.environmentVariables.bothPresent ? 'success' : 'error'}`}>
              <span className="diag-label">Supabase URL:</span>
              <span className="diag-value">
                {diagnostics.environmentVariables.supabaseUrl ? '✓ Present' : '✗ Missing'}
              </span>
            </div>
            <div className={`diag-item ${diagnostics.environmentVariables.supabaseKey ? 'success' : 'error'}`}>
              <span className="diag-label">Supabase Key:</span>
              <span className="diag-value">
                {diagnostics.environmentVariables.supabaseKey ? `✓ ${diagnostics.environmentVariables.supabaseKey}` : '✗ Missing'}
              </span>
            </div>
          </div>

          {/* Network Test */}
          <div className="diag-section">
            <h4>Network Connectivity</h4>
            <div className={`diag-item ${diagnostics.networkTest.canReach ? 'success' : 'error'}`}>
              <span className="diag-label">Can Reach Supabase:</span>
              <span className="diag-value">
                {diagnostics.networkTest.canReach ? `✓ Yes (${diagnostics.networkTest.statusCode})` : `✗ No - ${diagnostics.networkTest.error}`}
              </span>
            </div>
          </div>

          {/* Client Initialization */}
          <div className="diag-section">
            <h4>Client Initialization</h4>
            <div className={`diag-item ${diagnostics.clientInitialization.initialized ? 'success' : 'error'}`}>
              <span className="diag-label">Client Initialized:</span>
              <span className="diag-value">
                {diagnostics.clientInitialization.initialized 
                  ? '✓ Yes' 
                  : `✗ No - ${diagnostics.clientInitialization.error}`}
              </span>
            </div>
          </div>

          {/* Auth Status */}
          <div className="diag-section">
            <h4>Authentication</h4>
            <div className={`diag-item ${diagnostics.authStatus.authenticated ? 'success' : 'warning'}`}>
              <span className="diag-label">Authenticated:</span>
              <span className="diag-value">
                {diagnostics.authStatus.authenticated 
                  ? `✓ Yes (${diagnostics.authStatus.user})` 
                  : '⚠ Anonymous access'}
              </span>
            </div>
          </div>

          {/* Connection Test */}
          <div className="diag-section">
            <h4>Database Connection</h4>
            <div className={`diag-item ${diagnostics.connectionTest.connected ? 'success' : 'error'}`}>
              <span className="diag-label">Connected:</span>
              <span className="diag-value">
                {diagnostics.connectionTest.connected 
                  ? '✓ Yes' 
                  : `✗ No - ${diagnostics.connectionTest.error}`}
              </span>
            </div>
            {diagnostics.connectionTest.errorCode && (
              <div className="diag-error-code">
                Error Code: {diagnostics.connectionTest.errorCode}
              </div>
            )}
          </div>

          {/* Issues & Recommendations */}
          {diagnostics.summary.issues.length > 0 && (
            <div className="diag-section error-section">
              <h4>⚠️ Issues Detected</h4>
              <ul className="issues-list">
                {diagnostics.summary.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostics.summary.recommendations.length > 0 && (
            <div className="diag-section recommendation-section">
              <h4>💡 Recommendations</h4>
              <ul className="recommendations-list">
                {diagnostics.summary.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">Error: {error}</div>}

      {healthCheck && (
        <div className={`health-check-content ${healthCheck.healthy ? 'healthy' : 'unhealthy'}`}>
          {/* Overall Status */}
          <div className="status-card overall">
            <div className="status-indicator">
              {healthCheck.healthy ? '✅' : '❌'}
            </div>
            <div className="status-text">
              <h3>Overall Status</h3>
              <p>{healthCheck.healthy ? 'Database is healthy' : 'Database has issues'}</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="status-card connection">
            <div className="card-header">
              <h3>Connection Status</h3>
              <span className={`badge ${healthCheck.connection.connected ? 'success' : 'error'}`}>
                {healthCheck.connection.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="card-content">
              <p>
                <strong>Status:</strong>{' '}
                {healthCheck.connection.connected ? '✓ Connected' : '✗ Not Connected'}
              </p>
              {healthCheck.connection.errors.length > 0 && (
                <div className="errors">
                  <strong>Errors:</strong>
                  <ul>
                    {healthCheck.connection.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Schema Verification */}
          <div className="status-card schema">
            <div className="card-header">
              <h3>Schema Verification</h3>
              <span className={`badge ${healthCheck.schema.valid ? 'success' : 'warning'}`}>
                {healthCheck.schema.valid ? 'Valid' : 'Issues Found'}
              </span>
            </div>
            <div className="card-content">
              <div className="tables-list">
                {healthCheck.schema.tables.map((table: any) => (
                  <div key={table.name} className={`table-row ${table.exists ? 'exists' : 'missing'}`}>
                    <span className="table-indicator">
                      {table.exists ? '✓' : '✗'}
                    </span>
                    <span className="table-name">{table.name}</span>
                    {table.error && (
                      <span className="table-error" title={table.error}>
                        ({table.error})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {!healthCheck.schema.valid && (
                <div className="warning-message">
                  <strong>⚠️ Database Setup Required:</strong>
                  <p>See <a href="#database-setup" onClick={() => window.open('/DATABASE_SETUP.md', '_blank')}>Database Setup Guide</a> for instructions.</p>
                </div>
              )}
            </div>
          </div>

          {/* Database Statistics */}
          <div className="status-card stats">
            <div className="card-header">
              <h3>Database Statistics</h3>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                {Object.entries(healthCheck.stats.rowCounts).map(([table, count]: [string, any]) => (
                  <div key={table} className="stat-item">
                    <div className="stat-value">{count}</div>
                    <div className="stat-label">{table}</div>
                  </div>
                ))}
              </div>
              {healthCheck.stats.errors.length > 0 && (
                <div className="errors">
                  <strong>Errors:</strong>
                  <ul>
                    {healthCheck.stats.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="check-timestamp">
            Last checked: {new Date(healthCheck.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseHealthCheck;
