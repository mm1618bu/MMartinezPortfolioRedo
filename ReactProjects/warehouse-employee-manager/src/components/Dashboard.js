import React from 'react';

function Dashboard({ employees, timeOffRequests }) {
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const pendingRequests = timeOffRequests.filter(req => req.status === 'Pending').length;
  
  const departments = [...new Set(employees.map(emp => emp.department))];
  const shifts = [...new Set(employees.map(emp => emp.shift))];

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <div className="stat-value">{employees.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Employees</h3>
          <div className="stat-value">{activeEmployees}</div>
        </div>
        <div className="stat-card">
          <h3>Pending PTO Requests</h3>
          <div className="stat-value">{pendingRequests}</div>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <div className="stat-value">{departments.length}</div>
        </div>
      </div>

      <div className="recent-activity card">
        <h2>Recent Time Off Requests</h2>
        {timeOffRequests.length > 0 ? (
          <ul className="activity-list">
            {timeOffRequests.slice(-5).reverse().map(request => (
              <li key={request.id} className="activity-item">
                <strong>{request.employeeName}</strong> - {request.type} on {request.date} 
                <span className={`badge badge-${request.status.toLowerCase()}`} style={{ marginLeft: '1rem' }}>
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No time off requests yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
