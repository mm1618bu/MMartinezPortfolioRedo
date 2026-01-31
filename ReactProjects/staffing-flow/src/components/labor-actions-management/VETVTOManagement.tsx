import { useState, useEffect } from 'react';
import {
  createLaborAction,
  getLaborActions,
  approveResponse,
  rejectResponse,
  closeLaborAction,
  CreateLaborActionRequest,
  LaborActionWithResponses,
} from '../../services/laborActionsManagementService';
import type { ManagerInfo } from './LaborActionsManagement';

interface VETVTOManagementProps {
  manager: ManagerInfo;
  compact?: boolean;
}

export function VETVTOManagement({ manager, compact = false }: VETVTOManagementProps) {
  const [actions, setActions] = useState<LaborActionWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [actionType, setActionType] = useState<'VET' | 'VTO'>('VET');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftType, setShiftType] = useState('Day Shift');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [positionsOffered, setPositionsOffered] = useState(5);
  const [reason, setReason] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');

  useEffect(() => {
    loadActions();
  }, [manager.organization_id]);

  async function loadActions() {
    try {
      setLoading(true);
      setError(null);
      const data = await getLaborActions(manager.organization_id, {
        department_id: manager.department_id,
        status: 'open',
      });
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAction(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftDate || !startTime || !endTime) return;

    try {
      setSubmitting(true);
      setError(null);

      const request: CreateLaborActionRequest = {
        organization_id: manager.organization_id,
        department_id: manager.department_id || '',
        action_type: actionType,
        shift_date: shiftDate,
        shift_type: shiftType,
        start_time: startTime,
        end_time: endTime,
        positions_offered: positionsOffered,
        reason: reason || undefined,
        offer_deadline: offerDeadline || undefined,
      };

      await createLaborAction(request);
      
      // Reset form
      setActionType('VET');
      setShiftDate('');
      setShiftType('Day Shift');
      setStartTime('08:00');
      setEndTime('17:00');
      setPositionsOffered(5);
      setReason('');
      setOfferDeadline('');
      setShowCreateForm(false);
      
      await loadActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveResponse(responseId: string) {
    try {
      await approveResponse(responseId, manager.organization_id, manager.manager_id);
      await loadActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  }

  async function handleRejectResponse(responseId: string) {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await rejectResponse(responseId, manager.organization_id, manager.manager_id, reason);
      await loadActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  }

  async function handleCloseAction(actionId: string) {
    if (!window.confirm('Close this labor action? No more responses will be accepted.')) return;

    try {
      await closeLaborAction(actionId, manager.organization_id);
      await loadActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close');
    }
  }

  if (loading) {
    return (
      <div className="card vet-vto-management">
        <div className="card-header">
          <h2>💼 VET/VTO Management</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const displayedActions = compact ? actions.slice(0, 3) : actions;

  return (
    <div className="card vet-vto-management">
      <div className="card-header">
        <h2>💼 VET/VTO Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Offer'}
        </button>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="create-action-form">
            <h3>Create VET/VTO Offer</h3>
            <form onSubmit={handleCreateAction}>
              <div className="form-row">
                <div className="form-group">
                  <label>Action Type *</label>
                  <select value={actionType} onChange={(e) => setActionType(e.target.value as 'VET' | 'VTO')} required>
                    <option value="VET">VET (Voluntary Extra Time)</option>
                    <option value="VTO">VTO (Voluntary Time Off)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Shift Date *</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Shift Type *</label>
                  <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} required>
                    <option>Day Shift</option>
                    <option>Night Shift</option>
                    <option>Evening Shift</option>
                    <option>Weekend</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Positions *</label>
                  <input
                    type="number"
                    value={positionsOffered}
                    onChange={(e) => setPositionsOffered(Number(e.target.value))}
                    min={1}
                    max={50}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Offer Deadline (Optional)</label>
                  <input
                    type="datetime-local"
                    value={offerDeadline}
                    onChange={(e) => setOfferDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="e.g., High volume expected, Coverage needed for absences..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Offer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Actions List */}
        <div className="actions-list">
          <h3>Active Offers <span className="badge badge-info">{actions.length}</span></h3>

          {actions.length === 0 ? (
            <div className="empty-state">
              <p>No active VET/VTO offers.</p>
              <p className="text-muted">Click "Create Offer" to post a new opportunity.</p>
            </div>
          ) : (
            <div className="action-cards">
              {displayedActions.map((action) => {
                const pendingResponses = action.responses.filter((r) => r.status === 'pending');
                const approvedResponses = action.responses.filter((r) => r.status === 'approved');

                return (
                  <div key={action.action_id} className={`action-card ${action.action_type.toLowerCase()}`}>
                    <div className="action-card-header">
                      <div className="action-info">
                        <span className={`badge badge-${action.action_type === 'VET' ? 'success' : 'warning'}`}>
                          {action.action_type}
                        </span>
                        <strong>{new Date(action.shift_date).toLocaleDateString()}</strong>
                        <span>{action.shift_type}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleCloseAction(action.action_id)}
                      >
                        Close Offer
                      </button>
                    </div>

                    <div className="action-details">
                      <div className="detail-row">
                        <span className="label">Time:</span>
                        <span>{action.start_time} - {action.end_time}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Positions:</span>
                        <span>
                          {action.positions_filled} / {action.positions_offered} filled
                          ({action.positions_remaining} remaining)
                        </span>
                      </div>
                      {action.reason && (
                        <div className="detail-row">
                          <span className="label">Reason:</span>
                          <span>{action.reason}</span>
                        </div>
                      )}
                      {action.offer_deadline && (
                        <div className="detail-row">
                          <span className="label">Deadline:</span>
                          <span>{new Date(action.offer_deadline).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Responses */}
                    {action.responses.length > 0 && (
                      <div className="responses-section">
                        <h4>
                          Responses
                          {pendingResponses.length > 0 && (
                            <span className="badge badge-warning">{pendingResponses.length} Pending</span>
                          )}
                        </h4>
                        <div className="responses-list">
                          {action.responses.map((response) => (
                            <div key={response.response_id} className={`response-item status-${response.status}`}>
                              <div className="response-employee">
                                <span className="employee-name">{response.employee_name}</span>
                                <span className="response-type">
                                  {response.response_type === 'accept' ? '✅ Accepted' : '❌ Declined'}
                                </span>
                              </div>
                              <div className="response-meta">
                                <span className="response-time">
                                  {new Date(response.response_time).toLocaleString()}
                                </span>
                                <span className={`status-badge badge badge-${getStatusBadgeColor(response.status)}`}>
                                  {response.status}
                                </span>
                              </div>
                              {response.status === 'pending' && response.response_type === 'accept' && (
                                <div className="response-actions">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApproveResponse(response.response_id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRejectResponse(response.response_id)}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {compact && actions.length > 3 && (
            <div className="card-footer">
              <button className="btn btn-link">View all {actions.length} offers →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'secondary';
  }
}
