import { useState, useEffect } from 'react';
import {
  getPTORequests,
  getPTOBalances,
  submitPTORequest,
  cancelPTORequest,
  PTORequest,
  PTOBalance,
} from '../../services/laborActionsService';
import type { EmployeeInfo } from './EmployeePortal';

interface PTORequestCardProps {
  employee: EmployeeInfo;
  compact?: boolean;
}

export function PTORequestCard({ employee, compact = false }: PTORequestCardProps) {
  const [requests, setRequests] = useState<PTORequest[]>([]);
  const [balances, setBalances] = useState<PTOBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [ptoType, setPtoType] = useState<string>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalHours, setTotalHours] = useState(8);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, [employee.employee_id]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [requestsData, balancesData] = await Promise.all([
        getPTORequests(employee.organization_id, employee.employee_id),
        getPTOBalances(employee.organization_id, employee.employee_id),
      ]);
      setRequests(requestsData);
      setBalances(balancesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await submitPTORequest({
        organization_id: employee.organization_id,
        employee_id: employee.employee_id,
        department_id: employee.department_id,
        pto_type: ptoType,
        start_date: startDate,
        end_date: endDate,
        total_hours: totalHours,
        reason: reason || undefined,
      });
      
      // Reset form
      setPtoType('vacation');
      setStartDate('');
      setEndDate('');
      setTotalHours(8);
      setReason('');
      setShowRequestForm(false);
      
      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!window.confirm('Are you sure you want to cancel this PTO request?')) return;

    try {
      await cancelPTORequest(requestId, employee.organization_id, employee.employee_id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    }
  }

  if (loading) {
    return (
      <div className="card pto-request-card">
        <div className="card-header">
          <h2>🌴 Paid Time Off</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const displayedRequests = compact ? requests.slice(0, 3) : requests;

  return (
    <div className="card pto-request-card">
      <div className="card-header">
        <h2>🌴 Paid Time Off</h2>
        <button className="btn btn-primary" onClick={() => setShowRequestForm(!showRequestForm)}>
          {showRequestForm ? 'Cancel' : '+ Request PTO'}
        </button>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* PTO Balances */}
        {balances.length > 0 && (
          <div className="pto-balances">
            <h3>Your PTO Balances</h3>
            <div className="balances-grid">
              {balances.map((balance) => (
                <div key={balance.pto_type} className="balance-item">
                  <div className="balance-type">{balance.pto_type}</div>
                  <div className="balance-hours">
                    <span className="available">{balance.available_hours}</span>
                    <span className="total">/ {balance.total_accrued_hours} hrs</span>
                  </div>
                  {balance.pending_hours > 0 && (
                    <div className="balance-pending">{balance.pending_hours} hrs pending</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <div className="pto-request-form">
            <h3>Submit PTO Request</h3>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pto-type">PTO Type *</label>
                  <select
                    id="pto-type"
                    value={ptoType}
                    onChange={(e) => setPtoType(e.target.value)}
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="bereavement">Bereavement</option>
                    <option value="jury_duty">Jury Duty</option>
                    <option value="military">Military Leave</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start-date">Start Date *</label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end-date">End Date *</label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="total-hours">Total Hours *</label>
                  <input
                    type="number"
                    id="total-hours"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    min={0.5}
                    step={0.5}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reason">Reason (Optional)</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for PTO request..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="pto-requests-list">
          <h3>
            My Requests
            {pendingRequests.length > 0 && (
              <span className="badge badge-warning">{pendingRequests.length} Pending</span>
            )}
          </h3>

          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No PTO requests yet.</p>
              <p className="text-muted">Click "Request PTO" to submit your first request.</p>
            </div>
          ) : (
            <div className="requests-list">
              {displayedRequests.map((request) => (
                <div key={request.request_id} className={`request-item status-${request.status}`}>
                  <div className="request-header">
                    <div className="request-type">
                      <span className="type-badge">{request.pto_type}</span>
                    </div>
                    <span className={`status-badge badge badge-${getStatusBadgeColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="request-dates">
                    <strong>
                      {new Date(request.start_date).toLocaleDateString()} -{' '}
                      {new Date(request.end_date).toLocaleDateString()}
                    </strong>
                    <span className="request-hours">({request.total_hours} hours)</span>
                  </div>

                  {request.reason && (
                    <div className="request-reason">{request.reason}</div>
                  )}

                  {request.status === 'denied' && request.denial_reason && (
                    <div className="request-denial">
                      <strong>Denial Reason:</strong> {request.denial_reason}
                    </div>
                  )}

                  <div className="request-metadata">
                    <span className="submitted-date">
                      Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                    </span>
                    {request.approved_at && (
                      <span className="approved-date">
                        {request.status === 'approved' ? 'Approved' : 'Denied'}:{' '}
                        {new Date(request.approved_at).toLocaleDateString()}
                        {request.approved_by_name && ` by ${request.approved_by_name}`}
                      </span>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancelRequest(request.request_id)}
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {compact && requests.length > 3 && (
            <div className="card-footer">
              <button className="btn btn-link">View all {requests.length} requests →</button>
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
    case 'denied':
      return 'danger';
    case 'cancelled':
      return 'secondary';
    default:
      return 'info';
  }
}
