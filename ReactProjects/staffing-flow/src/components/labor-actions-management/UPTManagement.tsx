import { useState, useEffect } from 'react';
import {
  getUPTExceptions,
  excuseUPTException,
  getEmployeesAtRisk,
  detectUPTExceptions,
  UPTExceptionWithEmployee,
  EmployeeAtRisk,
} from '../../services/laborActionsManagementService';
import type { ManagerInfo } from './LaborActionsManagement';

interface UPTManagementProps {
  manager: ManagerInfo;
  compact?: boolean;
}

export function UPTManagement({ manager, compact = false }: UPTManagementProps) {
  const [exceptions, setExceptions] = useState<UPTExceptionWithEmployee[]>([]);
  const [atRiskEmployees, setAtRiskEmployees] = useState<EmployeeAtRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'exceptions' | 'at-risk'>('at-risk');
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    loadData();
  }, [manager.organization_id, activeView]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      if (activeView === 'exceptions') {
        const data = await getUPTExceptions(manager.organization_id, {
          department_id: manager.department_id,
          is_excused: false,
          limit: compact ? 10 : 50,
        });
        setExceptions(data);
      } else {
        const data = await getEmployeesAtRisk(manager.organization_id, manager.department_id, ['warning', 'critical']);
        setAtRiskEmployees(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleExcuse(exceptionId: string) {
    const reason = window.prompt('Enter excuse reason (e.g., "Doctor note provided"):');
    if (!reason) return;

    try {
      await excuseUPTException(exceptionId, manager.organization_id, manager.manager_id, reason, true);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to excuse exception');
    }
  }

  async function handleDetectExceptions() {
    if (!window.confirm('Run exception detection for today? This will analyze attendance data and create new exceptions.')) return;

    try {
      setDetecting(true);
      const result = await detectUPTExceptions(manager.organization_id, manager.department_id);
      alert(`Detection complete!\n\nDetected: ${result.exceptions_detected}\nCreated: ${result.exceptions_created}\nUPT Deducted: ${result.upt_hours_deducted} hours\nEmployees Affected: ${result.employees_affected}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect exceptions');
    } finally {
      setDetecting(false);
    }
  }

  if (loading) {
    return (
      <div className="card upt-management">
        <div className="card-header">
          <h2>⏰ UPT Management</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card upt-management">
      <div className="card-header">
        <h2>⏰ UPT Management</h2>
        <div className="header-actions">
          {!compact && (
            <>
              <div className="view-toggle">
                <button
                  className={`btn btn-sm ${activeView === 'at-risk' ? 'active' : ''}`}
                  onClick={() => setActiveView('at-risk')}
                >
                  At-Risk Employees
                </button>
                <button
                  className={`btn btn-sm ${activeView === 'exceptions' ? 'active' : ''}`}
                  onClick={() => setActiveView('exceptions')}
                >
                  Recent Exceptions
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleDetectExceptions}
                disabled={detecting}
              >
                {detecting ? 'Detecting...' : '🔍 Detect Exceptions'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {activeView === 'at-risk' ? (
          <div className="at-risk-view">
            <h3>
              Employees At Risk
              <span className="badge badge-danger">{atRiskEmployees.length}</span>
            </h3>

            {atRiskEmployees.length === 0 ? (
              <div className="empty-state">
                <p>✅ No employees at risk!</p>
                <p className="text-muted">All employees have healthy UPT balances.</p>
              </div>
            ) : (
              <div className="at-risk-table">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Exceptions (30d)</th>
                      <th>Last Exception</th>
                      <th>Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRiskEmployees.map((emp) => (
                      <tr key={emp.employee_id} className={`status-${emp.balance_status}`}>
                        <td><strong>{emp.employee_name}</strong></td>
                        <td>{emp.department_name}</td>
                        <td>
                          <span className={`balance-badge badge badge-${getBalanceStatusColor(emp.balance_status)}`}>
                            {emp.current_balance_hours} hrs
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${getBalanceStatusColor(emp.balance_status)}`}>
                            {emp.balance_status}
                          </span>
                        </td>
                        <td>{emp.exceptions_last_30_days}</td>
                        <td>
                          {emp.last_exception_date ? new Date(emp.last_exception_date).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="recommended-action">
                            {emp.recommended_action}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="exceptions-view">
            <h3>
              Recent Exceptions
              <span className="badge badge-info">{exceptions.length}</span>
            </h3>

            {exceptions.length === 0 ? (
              <div className="empty-state">
                <p>✅ No unexcused exceptions!</p>
                <p className="text-muted">All recent exceptions have been reviewed.</p>
              </div>
            ) : (
              <div className="exceptions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Date/Time</th>
                      <th>Severity</th>
                      <th>Minutes</th>
                      <th>UPT Deducted</th>
                      <th>Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map((exc) => (
                      <tr key={exc.exception_id} className={`severity-${exc.severity}`}>
                        <td>
                          <div className="employee-cell">
                            <strong>{exc.employee_name}</strong>
                            <span className="department">{exc.department_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="exception-type">
                            {exc.exception_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="datetime-cell">
                            <div>{new Date(exc.exception_date).toLocaleDateString()}</div>
                            <div className="text-muted">
                              {new Date(exc.occurrence_time).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${getSeverityColor(exc.severity)}`}>
                            {exc.severity}
                          </span>
                        </td>
                        <td>{exc.minutes_missed}</td>
                        <td><strong>-{exc.upt_hours_deducted}</strong> hrs</td>
                        <td>
                          {exc.current_balance !== undefined && (
                            <span className={`balance-badge badge badge-${getBalanceStatusColor(exc.balance_status || 'healthy')}`}>
                              {exc.current_balance} hrs
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleExcuse(exc.exception_id)}
                          >
                            Excuse
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getBalanceStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
    default:
      return 'secondary';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'minor':
      return 'info';
    case 'moderate':
      return 'warning';
    case 'major':
      return 'warning';
    case 'critical':
      return 'danger';
    default:
      return 'secondary';
  }
}
