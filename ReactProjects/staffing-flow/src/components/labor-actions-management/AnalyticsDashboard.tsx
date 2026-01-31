import { useState, useEffect } from 'react';
import {
  getLaborActionsAnalytics,
  getPTOAnalytics,
  getUPTAnalytics,
  LaborActionsAnalytics,
  PTOAnalytics,
  UPTAnalytics,
} from '../../services/laborActionsManagementService';
import type { ManagerInfo } from './LaborActionsManagement';

interface AnalyticsDashboardProps {
  manager: ManagerInfo;
  compact?: boolean;
}

export function AnalyticsDashboard({ manager, compact = false }: AnalyticsDashboardProps) {
  const [laborAnalytics, setLaborAnalytics] = useState<LaborActionsAnalytics | null>(null);
  const [ptoAnalytics, setPtoAnalytics] = useState<PTOAnalytics | null>(null);
  const [uptAnalytics, setUptAnalytics] = useState<UPTAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [manager.organization_id, dateRange]);

  function getDateRange(): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange();

      const [labor, pto, upt] = await Promise.all([
        getLaborActionsAnalytics(manager.organization_id, startDate, endDate),
        getPTOAnalytics(manager.organization_id, startDate, endDate),
        getUPTAnalytics(manager.organization_id, startDate, endDate),
      ]);

      setLaborAnalytics(labor);
      setPtoAnalytics(pto);
      setUptAnalytics(upt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card analytics-dashboard">
        <div className="card-header">
          <h2>📈 Analytics Dashboard</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !laborAnalytics || !ptoAnalytics || !uptAnalytics) {
    return (
      <div className="card analytics-dashboard">
        <div className="card-header">
          <h2>📈 Analytics Dashboard</h2>
        </div>
        <div className="card-body">
          <div className="error-message">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card analytics-dashboard">
      <div className="card-header">
        <h2>📈 Analytics Dashboard</h2>
        {!compact && (
          <div className="date-range-selector">
            <button
              className={`btn btn-sm ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              Last Week
            </button>
            <button
              className={`btn btn-sm ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              Last Month
            </button>
            <button
              className={`btn btn-sm ${dateRange === 'quarter' ? 'active' : ''}`}
              onClick={() => setDateRange('quarter')}
            >
              Last Quarter
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        {/* Summary Cards */}
        <div className="analytics-summary">
          <div className="summary-card labor">
            <h3>VET/VTO</h3>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-value">{laborAnalytics.total_vet_offered}</div>
                <div className="stat-label">VET Offered</div>
              </div>
              <div className="stat">
                <div className="stat-value">{laborAnalytics.total_vto_offered}</div>
                <div className="stat-label">VTO Offered</div>
              </div>
              <div className="stat">
                <div className="stat-value">{laborAnalytics.vet_acceptance_rate}%</div>
                <div className="stat-label">VET Accept Rate</div>
              </div>
              <div className="stat">
                <div className="stat-value">{laborAnalytics.vto_acceptance_rate}%</div>
                <div className="stat-label">VTO Accept Rate</div>
              </div>
            </div>
          </div>

          <div className="summary-card pto">
            <h3>PTO</h3>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-value">{ptoAnalytics.total_requests}</div>
                <div className="stat-label">Total Requests</div>
              </div>
              <div className="stat">
                <div className="stat-value">{ptoAnalytics.pending_requests}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat">
                <div className="stat-value">{ptoAnalytics.approval_rate}%</div>
                <div className="stat-label">Approval Rate</div>
              </div>
              <div className="stat">
                <div className="stat-value">{ptoAnalytics.avg_approval_time_hours}h</div>
                <div className="stat-label">Avg Approval Time</div>
              </div>
            </div>
          </div>

          <div className="summary-card upt">
            <h3>UPT</h3>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-value">{uptAnalytics.total_exceptions}</div>
                <div className="stat-label">Total Exceptions</div>
              </div>
              <div className="stat">
                <div className="stat-value success">{uptAnalytics.employees_healthy}</div>
                <div className="stat-label">Healthy</div>
              </div>
              <div className="stat">
                <div className="stat-value warning">{uptAnalytics.employees_warning}</div>
                <div className="stat-label">Warning</div>
              </div>
              <div className="stat">
                <div className="stat-value danger">{uptAnalytics.employees_critical}</div>
                <div className="stat-label">Critical</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdowns */}
        {!compact && (
          <>
            {/* PTO by Type */}
            {ptoAnalytics.by_type.length > 0 && (
              <div className="analytics-section">
                <h3>PTO Requests by Type</h3>
                <div className="breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Requests</th>
                        <th>Approval Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptoAnalytics.by_type.map((item) => (
                        <tr key={item.pto_type}>
                          <td><span className="pto-type-badge">{item.pto_type}</span></td>
                          <td>{item.count}</td>
                          <td>
                            <div className="progress-bar-container">
                              <div className="progress-bar" style={{ width: `${item.approval_rate}%` }}></div>
                              <span className="progress-label">{item.approval_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* UPT Exceptions by Type */}
            {uptAnalytics.by_type.length > 0 && (
              <div className="analytics-section">
                <h3>UPT Exceptions by Type</h3>
                <div className="breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Exception Type</th>
                        <th>Count</th>
                        <th>Avg Hours Deducted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uptAnalytics.by_type.map((item) => (
                        <tr key={item.exception_type}>
                          <td>{item.exception_type.replace(/_/g, ' ')}</td>
                          <td>{item.count}</td>
                          <td>{item.avg_hours_deducted.toFixed(2)} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* By Department */}
            {uptAnalytics.by_department.length > 0 && (
              <div className="analytics-section">
                <h3>Performance by Department</h3>
                <div className="breakdown-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Total Exceptions</th>
                        <th>Employees At Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uptAnalytics.by_department.map((item) => (
                        <tr key={item.department_id}>
                          <td><strong>{item.department_name}</strong></td>
                          <td>{item.total_exceptions}</td>
                          <td>
                            {item.employees_at_risk > 0 ? (
                              <span className="badge badge-danger">{item.employees_at_risk}</span>
                            ) : (
                              <span className="badge badge-success">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
