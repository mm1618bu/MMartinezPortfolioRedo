import { useState, useEffect } from 'react';
import {
  getAvailableLaborActions,
  respondToLaborAction,
  getMyLaborActionResponses,
  LaborAction,
  LaborActionResponse,
} from '../../services/laborActionsService';
import type { EmployeeInfo } from './EmployeePortal';

interface LaborActionsCardProps {
  employee: EmployeeInfo;
  compact?: boolean;
}

export function LaborActionsCard({ employee, compact = false }: LaborActionsCardProps) {
  const [availableActions, setAvailableActions] = useState<LaborAction[]>([]);
  const [myResponses, setMyResponses] = useState<LaborActionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [employee.employee_id]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [actions, responses] = await Promise.all([
        getAvailableLaborActions(employee.organization_id, employee.employee_id),
        getMyLaborActionResponses(employee.organization_id, employee.employee_id),
      ]);
      setAvailableActions(actions);
      setMyResponses(responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(actionId: string, responseType: 'accept' | 'decline') {
    try {
      setRespondingTo(actionId);
      await respondToLaborAction(actionId, employee.employee_id, responseType, employee.organization_id);
      await loadData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond');
    } finally {
      setRespondingTo(null);
    }
  }

  if (loading) {
    return (
      <div className="card labor-actions-card">
        <div className="card-header">
          <h2>💼 VET/VTO Opportunities</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card labor-actions-card">
        <div className="card-header">
          <h2>💼 VET/VTO Opportunities</h2>
        </div>
        <div className="card-body">
          <div className="error-message">{error}</div>
          <button className="btn btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const openActions = availableActions.filter((a) => a.status === 'open');
  const displayedActions = compact ? openActions.slice(0, 3) : openActions;

  return (
    <div className="card labor-actions-card">
      <div className="card-header">
        <h2>💼 VET/VTO Opportunities</h2>
        <span className="badge badge-info">{openActions.length} Available</span>
      </div>
      <div className="card-body">
        {openActions.length === 0 ? (
          <div className="empty-state">
            <p>No VET/VTO opportunities available at this time.</p>
            <p className="text-muted">Check back later for voluntary extra time (VET) or voluntary time off (VTO) opportunities.</p>
          </div>
        ) : (
          <div className="labor-actions-list">
            {displayedActions.map((action) => {
              const myResponse = myResponses.find((r) => r.action_id === action.action_id);
              const isResponding = respondingTo === action.action_id;

              return (
                <div key={action.action_id} className={`labor-action-item ${action.action_type.toLowerCase()}`}>
                  <div className="action-header">
                    <div className="action-type-badge">
                      <span className={`badge badge-${action.action_type === 'VET' ? 'success' : 'warning'}`}>
                        {action.action_type}
                      </span>
                    </div>
                    <div className="action-date">
                      {new Date(action.shift_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="action-details">
                    <div className="action-time">
                      <strong>
                        {new Date(`2000-01-01T${action.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}{' '}
                        -{' '}
                        {new Date(`2000-01-01T${action.end_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </strong>
                    </div>
                    <div className="action-shift">{action.shift_type}</div>
                    <div className="action-department">{action.department_name}</div>
                    {action.reason && <div className="action-reason">{action.reason}</div>}
                  </div>

                  <div className="action-availability">
                    <span className="positions-badge">
                      {action.positions_remaining} of {action.positions_offered} positions remaining
                    </span>
                    {action.offer_deadline && (
                      <span className="deadline-badge">
                        Deadline: {new Date(action.offer_deadline).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="action-actions">
                    {myResponse ? (
                      <div className={`response-status ${myResponse.response_type}`}>
                        <span className="response-icon">{myResponse.response_type === 'accept' ? '✅' : '❌'}</span>
                        <span>
                          You {myResponse.response_type === 'accept' ? 'accepted' : 'declined'} this offer
                        </span>
                        {myResponse.status === 'pending' && <span className="badge badge-warning">Pending Approval</span>}
                        {myResponse.status === 'approved' && <span className="badge badge-success">Approved</span>}
                        {myResponse.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                      </div>
                    ) : (
                      <div className="response-buttons">
                        <button
                          className="btn btn-success"
                          onClick={() => handleRespond(action.action_id, 'accept')}
                          disabled={isResponding || action.positions_remaining === 0}
                        >
                          {isResponding ? 'Accepting...' : action.action_type === 'VET' ? 'Accept VET' : 'Accept VTO'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleRespond(action.action_id, 'decline')}
                          disabled={isResponding}
                        >
                          {isResponding ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {compact && openActions.length > 3 && (
          <div className="card-footer">
            <button className="btn btn-link">View all {openActions.length} opportunities →</button>
          </div>
        )}
      </div>
    </div>
  );
}
