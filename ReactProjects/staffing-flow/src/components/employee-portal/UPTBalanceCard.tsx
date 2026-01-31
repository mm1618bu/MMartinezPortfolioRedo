import { useState, useEffect } from 'react';
import { getUPTBalance, getUPTExceptions, UPTBalance, UPTException } from '../../services/laborActionsService';
import type { EmployeeInfo } from './EmployeePortal';

interface UPTBalanceCardProps {
  employee: EmployeeInfo;
  compact?: boolean;
}

export function UPTBalanceCard({ employee, compact = false }: UPTBalanceCardProps) {
  const [balance, setBalance] = useState<UPTBalance | null>(null);
  const [exceptions, setExceptions] = useState<UPTException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllExceptions, setShowAllExceptions] = useState(false);

  useEffect(() => {
    loadData();
  }, [employee.employee_id]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await getUPTBalance(employee.organization_id, employee.employee_id);
      setBalance(data.balance);
      setExceptions(data.recent_exceptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card upt-balance-card">
        <div className="card-header">
          <h2>⏰ Attendance & UPT</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="card upt-balance-card">
        <div className="card-header">
          <h2>⏰ Attendance & UPT</h2>
        </div>
        <div className="card-body">
          <div className="error-message">{error || 'No UPT balance found'}</div>
          <button className="btn btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const balancePercentage = (balance.current_balance_hours / balance.initial_balance_hours) * 100;
  const displayedExceptions = compact ? exceptions.slice(0, 3) : exceptions;

  return (
    <div className="card upt-balance-card">
      <div className="card-header">
        <h2>⏰ Attendance & UPT</h2>
        <span className={`badge badge-${getBalanceStatusColor(balance.balance_status)}`}>
          {balance.balance_status.toUpperCase()}
        </span>
      </div>

      <div className="card-body">
        {/* Balance Overview */}
        <div className="upt-balance-overview">
          <div className="balance-circle-container">
            <svg className="balance-circle" viewBox="0 0 100 100">
              <circle
                className="balance-circle-bg"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="8"
              />
              <circle
                className={`balance-circle-progress status-${balance.balance_status}`}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${balancePercentage * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="balance-text">
              <div className="balance-hours">{balance.current_balance_hours}</div>
              <div className="balance-label">hours</div>
            </div>
          </div>

          <div className="balance-details">
            <div className="balance-stat">
              <span className="stat-label">Initial Balance:</span>
              <span className="stat-value">{balance.initial_balance_hours} hrs</span>
            </div>
            <div className="balance-stat">
              <span className="stat-label">Total Used:</span>
              <span className="stat-value">{balance.total_used_hours} hrs</span>
            </div>
            <div className="balance-stat">
              <span className="stat-label">Total Excused:</span>
              <span className="stat-value">{balance.total_excused_hours} hrs</span>
            </div>
            <div className="balance-stat">
              <span className="stat-label">This Month:</span>
              <span className="stat-value">{balance.exceptions_this_month} exceptions</span>
            </div>
            <div className="balance-stat">
              <span className="stat-label">This Year:</span>
              <span className="stat-value">{balance.exceptions_this_year} exceptions</span>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="upt-thresholds">
          <h4>Balance Thresholds</h4>
          <div className="threshold-bar">
            <div
              className="threshold-marker warning"
              style={{ left: `${(balance.warning_threshold_hours / balance.initial_balance_hours) * 100}%` }}
            >
              <span className="threshold-label">Warning: {balance.warning_threshold_hours}h</span>
            </div>
            <div
              className="threshold-marker critical"
              style={{ left: `${(balance.critical_threshold_hours / balance.initial_balance_hours) * 100}%` }}
            >
              <span className="threshold-label">Critical: {balance.critical_threshold_hours}h</span>
            </div>
            <div
              className="threshold-marker termination"
              style={{ left: '0%' }}
            >
              <span className="threshold-label">Termination: 0h</span>
            </div>
          </div>
        </div>

        {/* Status Warning */}
        {balance.balance_status === 'warning' && (
          <div className="alert alert-warning">
            <strong>⚠️ Warning:</strong> Your UPT balance is below {balance.warning_threshold_hours} hours.
            Please improve your attendance to avoid reaching critical status.
          </div>
        )}

        {balance.balance_status === 'critical' && (
          <div className="alert alert-danger">
            <strong>🚨 Critical:</strong> Your UPT balance is below {balance.critical_threshold_hours} hours.
            Further exceptions may result in termination. Please speak with your manager immediately.
          </div>
        )}

        {balance.balance_status === 'terminated' && (
          <div className="alert alert-danger">
            <strong>❌ Terminated:</strong> Your UPT balance has reached 0 hours.
            Please contact HR immediately.
          </div>
        )}

        {/* Recent Exceptions */}
        <div className="upt-exceptions-list">
          <h3>
            Recent Exceptions
            {exceptions.length > 0 && (
              <span className="badge badge-info">{exceptions.length}</span>
            )}
          </h3>

          {exceptions.length === 0 ? (
            <div className="empty-state">
              <p>✅ No recent attendance exceptions.</p>
              <p className="text-muted">Keep up the good work!</p>
            </div>
          ) : (
            <div className="exceptions-list">
              {displayedExceptions.map((exception) => (
                <div
                  key={exception.exception_id}
                  className={`exception-item severity-${exception.severity} ${exception.is_excused ? 'excused' : ''}`}
                >
                  <div className="exception-header">
                    <div className="exception-type">
                      <span className={`exception-icon ${exception.exception_type}`}>
                        {getExceptionIcon(exception.exception_type)}
                      </span>
                      <span className="exception-type-text">
                        {exception.exception_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`severity-badge badge badge-${getSeverityColor(exception.severity)}`}>
                      {exception.severity}
                    </span>
                  </div>

                  <div className="exception-details">
                    <div className="exception-date">
                      <strong>
                        {new Date(exception.exception_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>
                      <span className="exception-time">
                        at{' '}
                        {new Date(exception.occurrence_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>

                    <div className="exception-impact">
                      <span className="minutes-missed">{exception.minutes_missed} minutes missed</span>
                      <span className="upt-deducted">
                        {exception.is_excused ? (
                          <span className="excused-text">✅ Excused</span>
                        ) : (
                          <span className="deducted-text">-{exception.upt_hours_deducted} hours</span>
                        )}
                      </span>
                    </div>

                    {exception.notes && (
                      <div className="exception-notes">{exception.notes}</div>
                    )}

                    {exception.is_excused && exception.excuse_reason && (
                      <div className="exception-excuse">
                        <strong>Excuse Reason:</strong> {exception.excuse_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {compact && exceptions.length > 3 && (
            <div className="card-footer">
              <button className="btn btn-link" onClick={() => setShowAllExceptions(true)}>
                View all {exceptions.length} exceptions →
              </button>
            </div>
          )}
        </div>

        {/* What is UPT? */}
        {!compact && (
          <div className="upt-info">
            <h4>What is UPT?</h4>
            <p>
              UPT (Unpaid Time) is your attendance balance. You start with {balance.initial_balance_hours} hours.
              Attendance exceptions (tardiness, absences, etc.) deduct from your balance.
            </p>
            <ul>
              <li>
                <strong>Healthy:</strong> Above {balance.warning_threshold_hours} hours - no action needed
              </li>
              <li>
                <strong>Warning:</strong> Below {balance.warning_threshold_hours} hours - coaching conversation
              </li>
              <li>
                <strong>Critical:</strong> Below {balance.critical_threshold_hours} hours - written warning
              </li>
              <li>
                <strong>Terminated:</strong> 0 hours remaining - termination review
              </li>
            </ul>
            <p className="text-muted">
              If you believe an exception was recorded in error, please speak with your manager to request an excuse.
            </p>
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
    case 'terminated':
      return 'dark';
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

function getExceptionIcon(type: string): string {
  switch (type) {
    case 'absence':
      return '🚫';
    case 'tardiness':
      return '⏰';
    case 'early_departure':
      return '🏃';
    case 'missed_punch':
      return '📍';
    case 'extended_break':
      return '☕';
    case 'no_call_no_show':
      return '❌';
    case 'partial_absence':
      return '⚠️';
    default:
      return '•';
  }
}
