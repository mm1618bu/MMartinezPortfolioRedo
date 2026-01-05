import React, { useState } from 'react';

function PTOApprovals({ requests, onUpdateStatus }) {
  const [filter, setFilter] = useState('Pending');

  const filteredRequests = requests.filter(req => {
    if (filter === 'All') return true;
    return req.status === filter;
  });

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this PTO request?')) {
      onUpdateStatus(id, 'Approved');
    }
  };

  const handleDeny = (id) => {
    if (window.confirm('Are you sure you want to deny this PTO request?')) {
      onUpdateStatus(id, 'Denied');
    }
  };

  const getPendingCount = () => requests.filter(req => req.status === 'Pending').length;
  const getApprovedCount = () => requests.filter(req => req.status === 'Approved').length;
  const getDeniedCount = () => requests.filter(req => req.status === 'Denied').length;

  return (
    <div>
      <h1 className="page-title">PTO Approvals</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Pending Requests</h3>
          <div className="stat-value">{getPendingCount()}</div>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <div className="stat-value">{getApprovedCount()}</div>
        </div>
        <div className="stat-card">
          <h3>Denied</h3>
          <div className="stat-value">{getDeniedCount()}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>PTO Requests</h2>
          <div className="form-group" style={{ marginBottom: 0, width: '200px' }}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date Requested</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.employeeName}</td>
                  <td>{new Date(request.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                  <td>{request.hours || 8} hours</td>
                  <td>
                    <span className={`badge badge-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === 'Pending' ? (
                      <div className="action-buttons">
                        <button 
                          className="btn btn-success btn-small" 
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeny(request.id)}
                        >
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        {request.status === 'Approved' ? 'Already approved' : 'Already denied'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No {filter.toLowerCase()} PTO requests</p>
            <p style={{ fontSize: '0.9rem' }}>
              {filter === 'Pending' 
                ? 'All caught up! There are no pending requests to review.' 
                : `No ${filter.toLowerCase()} requests found.`}
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Approval Guidelines</h2>
        <ul style={{ lineHeight: '1.8', color: '#2c3e50' }}>
          <li>Review staffing levels before approving time off requests</li>
          <li>Ensure adequate coverage for the requested date and shift</li>
          <li>Consider department workload and upcoming deadlines</li>
          <li>Process requests in the order they were submitted when possible</li>
          <li>Communicate decisions to employees promptly</li>
        </ul>
      </div>
    </div>
  );
}

export default PTOApprovals;
