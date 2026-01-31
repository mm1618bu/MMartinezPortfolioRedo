import { useState, useEffect } from 'react';
import {
  getPendingPTORequests,
  approvePTORequest,
  denyPTORequest,
  PTORequestWithEmployee,
} from '../../services/laborActionsManagementService';
import type { ManagerInfo } from './LaborActionsManagement';

interface PTOApprovalDashboardProps {
  manager: ManagerInfo;
  compact?: boolean;
}

export function PTOApprovalDashboard({ manager, compact = false }: PTOApprovalDashboardProps) {
  const [requests, setRequests] = useState<PTORequestWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [manager.organization_id]);

  async function loadRequests() {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingPTORequests(manager.organization_id, manager.department_id);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string) {
    try {
      setProcessing(requestId);
      await approvePTORequest(requestId, manager.organization_id, manager.manager_id);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  }

  async function handleDeny(requestId: string) {
    const reason = window.prompt('Enter denial reason:');
    if (!reason) return;

    try {
      setProcessing(requestId);
      await denyPTORequest(requestId, manager.organization_id, manager.manager_id, reason);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="card pto-approval-dashboard">
        <div className="card-header">
          <h2>🌴 PTO Approval Dashboard</h2>
        </div>
        <div className="card-body">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const displayedRequests = compact ? requests.slice(0, 5) : requests;

  return (
    <div className="card pto-approval-dashboard">
      <div className="card-header">
        <h2>🌴 PTO Approval Dashboard</h2>
        <span className="badge badge-warning">{requests.length} Pending</span>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="empty-state">
            <p>✅ No pending PTO requests!</p>
            <p className="text-muted">All requests have been reviewed.</p>
          </div>
        ) : (
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Hours</th>
                  <th>Balance</th>
                  <th>Submitted</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRequests.map((request) => (
                  <tr key={request.request_id}>
                    <td>
                      <div className="employee-cell">
                        <strong>{request.employee_name}</strong>
                        <span className="department">{request.department_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pto-type-badge">{request.pto_type}</span>
                    </td>
                    <td>
                      <div className="dates-cell">
                        <div>{new Date(request.start_date).toLocaleDateString()}</div>
                        <div>{new Date(request.end_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td>
                      <strong>{request.total_hours}</strong> hrs
                    </td>
                    <td>
                      {request.employee_balance !== undefined ? (
                        <span className={`balance-indicator ${request.employee_balance >= request.total_hours ? 'sufficient' : 'insufficient'}`}>
                          {request.employee_balance} hrs
                          {request.employee_balance < request.total_hours && ' ⚠️'}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-muted">
                        {new Date(request.submitted_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="reason-cell">
                        {request.reason || <span className="text-muted">No reason</span>}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApprove(request.request_id)}
                          disabled={processing === request.request_id}
                        >
                          {processing === request.request_id ? '...' : '✓'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeny(request.request_id)}
                          disabled={processing === request.request_id}
                        >
                          {processing === request.request_id ? '...' : '✗'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {compact && requests.length > 5 && (
          <div className="card-footer">
            <button className="btn btn-link">View all {requests.length} requests →</button>
          </div>
        )}
      </div>
    </div>
  );
}
