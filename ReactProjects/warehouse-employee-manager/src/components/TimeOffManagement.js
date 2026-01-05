import React, { useState } from 'react';

function TimeOffManagement({ employees, onAddRequest, onAddVet, vetRequests = [] }) {
  const [activeTab, setActiveTab] = useState('vet');
  
  const [vetFormData, setVetFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    shiftPremium: 0,
    notes: '',
  });

  const [timeOffFormData, setTimeOffFormData] = useState({
    employeeId: '',
    type: 'UTO',
    date: '',
    hours: '',
    reason: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleVetChange = (e) => {
    const { name, value } = e.target;
    setVetFormData({
      ...vetFormData,
      [name]: value,
    });
  };

  const handleTimeOffChange = (e) => {
    const { name, value } = e.target;
    setTimeOffFormData({
      ...timeOffFormData,
      [name]: value,
    });
  };

  const calculateVetHours = () => {
    if (!vetFormData.startTime || !vetFormData.endTime) return 0;
    const start = new Date(`2000-01-01T${vetFormData.startTime}`);
    const end = new Date(`2000-01-01T${vetFormData.endTime}`);
    const diff = (end - start) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const handleVetSubmit = (e) => {
    e.preventDefault();
    
    const selectedEmployee = employees.find(emp => emp.id === parseInt(vetFormData.employeeId));
    
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    const hours = calculateVetHours();
    if (hours <= 0) {
      alert('End time must be after start time');
      return;
    }

    const request = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      date: vetFormData.date,
      startTime: vetFormData.startTime,
      endTime: vetFormData.endTime,
      hours: hours,
      shiftPremium: parseFloat(vetFormData.shiftPremium) || 0,
      notes: vetFormData.notes,
    };

    onAddVet(request);
    
    setVetFormData({
      employeeId: '',
      date: '',
      startTime: '',
      endTime: '',
      shiftPremium: 0,
      notes: '',
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleTimeOffSubmit = (e) => {
    e.preventDefault();
    
    const selectedEmployee = employees.find(emp => emp.id === parseInt(timeOffFormData.employeeId));
    
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    const request = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      type: timeOffFormData.type,
      date: timeOffFormData.date,
      hours: timeOffFormData.hours,
      reason: timeOffFormData.reason,
    };

    onAddRequest(request);
    
    setTimeOffFormData({
      employeeId: '',
      type: 'UTO',
      date: '',
      hours: '',
      reason: '',
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const timeOffTypes = [
    { value: 'UTO', label: 'Unpaid Time Off (UTO)', description: 'Time off without pay' },
    { value: 'VTO', label: 'Voluntary Time Off (VTO)', description: 'Voluntary unpaid time off when work is slow' },
    { value: 'PTO', label: 'Paid Time Off (PTO)', description: 'Requires approval' },
  ];

  const shiftPremiums = [
    { value: 0, label: 'No Premium' },
    { value: 0.5, label: 'Weekend ($0.50/hr)' },
    { value: 1.0, label: 'Night Shift ($1.00/hr)' },
    { value: 1.5, label: 'Holiday ($1.50/hr)' },
    { value: 2.0, label: 'Peak Season ($2.00/hr)' },
  ];

  return (
    <div>
      <h1 className="page-title">Time Management</h1>
      
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ecf0f1' }}>
          <button 
            onClick={() => setActiveTab('vet')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'vet' ? '3px solid #3498db' : 'none',
              color: activeTab === 'vet' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'vet' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            VET (Overtime)
          </button>
          <button 
            onClick={() => setActiveTab('timeoff')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'timeoff' ? '3px solid #3498db' : 'none',
              color: activeTab === 'timeoff' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'timeoff' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            Time Off Requests
          </button>
        </div>

        {showSuccess && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            border: '1px solid #c3e6cb'
          }}>
            {activeTab === 'vet' ? 'VET overtime scheduled successfully!' : 'Time off request added successfully!'}
          </div>
        )}

        {activeTab === 'vet' ? (
          <div>
            <h2>Schedule Voluntary Extra Time (Overtime)</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '1.5rem' }}>
              VET is paid overtime offered to employees when additional staffing is needed.
            </p>
            
            <form onSubmit={handleVetSubmit}>
              <div className="form-group">
                <label>Employee *</label>
                <select 
                  name="employeeId" 
                  value={vetFormData.employeeId} 
                  onChange={handleVetChange}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department} ({emp.shift} Shift)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  name="date" 
                  value={vetFormData.date} 
                  onChange={handleVetChange}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input 
                    type="time" 
                    name="startTime" 
                    value={vetFormData.startTime} 
                    onChange={handleVetChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input 
                    type="time" 
                    name="endTime" 
                    value={vetFormData.endTime} 
                    onChange={handleVetChange}
                    required
                  />
                </div>
              </div>

              {vetFormData.startTime && vetFormData.endTime && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e8f4f8', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <strong>Total Hours:</strong> {calculateVetHours().toFixed(2)} hours
                </div>
              )}

              <div className="form-group">
                <label>Shift Premium</label>
                <select 
                  name="shiftPremium" 
                  value={vetFormData.shiftPremium} 
                  onChange={handleVetChange}
                >
                  {shiftPremiums.map(premium => (
                    <option key={premium.value} value={premium.value}>
                      {premium.label}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '0.5rem' }}>
                  Additional hourly rate on top of overtime pay
                </p>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input 
                  type="text" 
                  name="notes" 
                  value={vetFormData.notes} 
                  onChange={handleVetChange}
                  placeholder="Optional notes or reason for VET"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Schedule VET
              </button>
            </form>

            {vetRequests.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3>Scheduled VET</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Hours</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vetRequests.map(req => (
                      <tr key={req.id}>
                        <td>{req.employeeName}</td>
                        <td>{new Date(req.date).toLocaleDateString()}</td>
                        <td>{req.startTime} - {req.endTime}</td>
                        <td>{req.hours.toFixed(2)} hrs</td>
                        <td>${req.shiftPremium.toFixed(2)}/hr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2>Add Time Off Request</h2>
            
            <form onSubmit={handleTimeOffSubmit}>
              <div className="form-group">
                <label>Employee *</label>
                <select 
                  name="employeeId" 
                  value={timeOffFormData.employeeId} 
                  onChange={handleTimeOffChange}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department} ({emp.shift} Shift)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type of Time Off *</label>
                <select 
                  name="type" 
                  value={timeOffFormData.type} 
                  onChange={handleTimeOffChange}
                  required
                >
                  {timeOffTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '0.5rem' }}>
                  {timeOffTypes.find(t => t.value === timeOffFormData.type)?.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={timeOffFormData.date} 
                    onChange={handleTimeOffChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hours *</label>
                  <input 
                    type="number" 
                    name="hours" 
                    value={timeOffFormData.hours} 
                    onChange={handleTimeOffChange}
                    min="0.5"
                    step="0.5"
                    placeholder="e.g., 8"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Notes</label>
                <input 
                  type="text" 
                  name="reason" 
                  value={timeOffFormData.reason} 
                  onChange={handleTimeOffChange}
                  placeholder="Optional"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </form>

            <div style={{ marginTop: '2rem' }}>
              <h3>Time Off Type Guide</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {timeOffTypes.map(type => (
                  <div key={type.value} style={{ 
                    padding: '1rem', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>{type.label}</h4>
                    <p style={{ color: '#7f8c8d', margin: 0 }}>{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeOffManagement;
