import React, { useState } from 'react';

function EmployeeManagement({ employees, setEmployees }) {
  const [activeTab, setActiveTab] = useState('employees');
  const [showSuccess, setShowSuccess] = useState('');
  
  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    id: null,
    name: '',
    department: '',
    shift: '',
    location: '',
    status: 'Active',
  });
  
  // Department state
  const [departments, setDepartments] = useState([
    'Receiving',
    'Packing',
    'Shipping',
    'Quality Control',
  ]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  
  // Location state
  const [locations, setLocations] = useState([
    { id: 1, name: 'Main Warehouse', address: '123 Industrial Blvd', city: 'Chicago', state: 'IL' },
    { id: 2, name: 'Distribution Center', address: '456 Logistics Way', city: 'Denver', state: 'CO' },
  ]);
  const [locationForm, setLocationForm] = useState({
    id: null,
    name: '',
    address: '',
    city: '',
    state: '',
  });
  
  // Shift state
  const [shifts, setShifts] = useState([
    { id: 1, name: 'Day', startTime: '06:00', endTime: '14:30' },
    { id: 2, name: 'Night', startTime: '18:00', endTime: '02:30' },
  ]);
  const [shiftForm, setShiftForm] = useState({
    id: null,
    name: '',
    startTime: '',
    endTime: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);

  // Employee Management Functions
  const handleEmployeeChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm({ ...employeeForm, [name]: value });
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      setEmployees(employees.map(emp => 
        emp.id === employeeForm.id ? employeeForm : emp
      ));
      setShowSuccess('Employee updated successfully!');
    } else {
      const newEmployee = {
        ...employeeForm,
        id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
      };
      setEmployees([...employees, newEmployee]);
      setShowSuccess('Employee added successfully!');
    }
    
    resetEmployeeForm();
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEditEmployee = (employee) => {
    setEmployeeForm(employee);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
      setShowSuccess('Employee removed successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      id: null,
      name: '',
      department: '',
      shift: '',
      location: '',
      status: 'Active',
    });
    setIsEditing(false);
  };

  // Department Management Functions
  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments([...departments, newDepartment.trim()]);
      setNewDepartment('');
      setShowSuccess('Department added successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const handleDeleteDepartment = (dept) => {
    const hasEmployees = employees.some(emp => emp.department === dept);
    if (hasEmployees) {
      alert('Cannot delete department with assigned employees. Please reassign employees first.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the ${dept} department?`)) {
      setDepartments(departments.filter(d => d !== dept));
      setShowSuccess('Department deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const handleRenameDepartment = (oldName, newName) => {
    if (newName.trim() && !departments.includes(newName.trim())) {
      setDepartments(departments.map(d => d === oldName ? newName.trim() : d));
      setEmployees(employees.map(emp => 
        emp.department === oldName ? { ...emp, department: newName.trim() } : emp
      ));
      setEditingDept(null);
      setShowSuccess('Department renamed successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  // Shift Management Functions
  const handleShiftChange = (e) => {
    const { name, value } = e.target;
    setShiftForm({ ...shiftForm, [name]: value });
  };

  const handleShiftSubmit = (e) => {
    e.preventDefault();
    
    if (shiftForm.id) {
      setShifts(shifts.map(shift => 
        shift.id === shiftForm.id ? shiftForm : shift
      ));
      setShowSuccess('Shift updated successfully!');
    } else {
      const newShift = {
        ...shiftForm,
        id: shifts.length > 0 ? Math.max(...shifts.map(s => s.id)) + 1 : 1,
      };
      setShifts([...shifts, newShift]);
      setShowSuccess('Shift added successfully!');
    }
    
    resetShiftForm();
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEditShift = (shift) => {
    setShiftForm(shift);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteShift = (id) => {
    const shift = shifts.find(s => s.id === id);
    const hasEmployees = employees.some(emp => emp.shift === shift.name);
    
    if (hasEmployees) {
      alert('Cannot delete shift with assigned employees. Please reassign employees first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setShifts(shifts.filter(s => s.id !== id));
      setShowSuccess('Shift deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const resetShiftForm = () => {
    setShiftForm({
      id: null,
      name: '',
      startTime: '',
      endTime: '',
    });
  };

  // Location Management Functions
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationForm({ ...locationForm, [name]: value });
  };

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    
    if (locationForm.id) {
      setLocations(locations.map(loc => 
        loc.id === locationForm.id ? locationForm : loc
      ));
      setShowSuccess('Location updated successfully!');
    } else {
      const newLocation = {
        ...locationForm,
        id: locations.length > 0 ? Math.max(...locations.map(l => l.id)) + 1 : 1,
      };
      setLocations([...locations, newLocation]);
      setShowSuccess('Location added successfully!');
    }
    
    resetLocationForm();
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEditLocation = (location) => {
    setLocationForm(location);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLocation = (id) => {
    const location = locations.find(l => l.id === id);
    const hasEmployees = employees.some(emp => emp.location === location.name);
    
    if (hasEmployees) {
      alert('Cannot delete location with assigned employees. Please reassign employees first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this location?')) {
      setLocations(locations.filter(l => l.id !== id));
      setShowSuccess('Location deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const resetLocationForm = () => {
    setLocationForm({
      id: null,
      name: '',
      address: '',
      city: '',
      state: '',
    });
  };

  const calculateShiftDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(`2000-01-01T${start}`);
    let endDate = new Date(`2000-01-01T${end}`);
    
    // Handle overnight shifts
    if (endDate <= startDate) {
      endDate = new Date(`2000-01-02T${end}`);
    }
    
    const diff = (endDate - startDate) / (1000 * 60 * 60);
    return `${diff.toFixed(1)} hours`;
  };

  return (
    <div>
      <h1 className="page-title">Employee & Workforce Management</h1>
      
      {showSuccess && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          {showSuccess}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ecf0f1' }}>
          <button 
            onClick={() => setActiveTab('employees')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'employees' ? '3px solid #3498db' : 'none',
              color: activeTab === 'employees' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'employees' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            Employees
          </button>
          <button 
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'departments' ? '3px solid #3498db' : 'none',
              color: activeTab === 'departments' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'departments' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            Departments
          </button>
          <button 
            onClick={() => setActiveTab('shifts')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'shifts' ? '3px solid #3498db' : 'none',
              color: activeTab === 'shifts' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'shifts' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            Shifts
          </button>
          <button 
            onClick={() => setActiveTab('locations')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'locations' ? '3px solid #3498db' : 'none',
              color: activeTab === 'locations' ? '#3498db' : '#7f8c8d',
              fontWeight: activeTab === 'locations' ? 'bold' : 'normal',
              fontSize: '1rem'
            }}
          >
            Locations
          </button>
        </div>

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div>
            <h2>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleEmployeeSubmit}>
              <div className="form-group">
                <label>Employee Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={employeeForm.name}
                  onChange={handleEmployeeChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Department *</label>
                  <select 
                    name="department"
                    value={employeeForm.department}
                    onChange={handleEmployeeChange}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <select 
                    name="location"
                    value={employeeForm.location}
                    onChange={handleEmployeeChange}
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} - {loc.city}, {loc.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Shift *</label>
                <select 
                  name="shift"
                  value={employeeForm.shift}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">Select shift</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.name}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select 
                  name="status"
                  value={employeeForm.status}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Employee' : 'Add Employee'}
                </button>
                {isEditing && (
                  <button type="button" className="btn" onClick={resetEmployeeForm} style={{ backgroundColor: '#95a5a6', color: 'white' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Employee List ({employees.length})</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.department}</td>
                    <td>{employee.location || 'N/A'}</td>
                    <td>{employee.shift}</td>
                    <td>
                      <span className={`badge badge-${employee.status.toLowerCase().replace(' ', '-')}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-small" 
                          onClick={() => handleEditEmployee(employee)}
                          style={{ backgroundColor: '#3498db', color: 'white' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div>
            <h2>Add New Department</h2>
            <form onSubmit={handleAddDepartment} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <input 
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Enter department name"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Department
                </button>
              </div>
            </form>

            <h3>Departments ({departments.length})</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {departments.map(dept => {
                const employeeCount = employees.filter(emp => emp.department === dept).length;
                return (
                  <div key={dept} style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <div style={{ flex: 1 }}>
                      {editingDept === dept ? (
                        <input 
                          type="text"
                          defaultValue={dept}
                          onBlur={(e) => {
                            if (e.target.value !== dept) {
                              handleRenameDepartment(dept, e.target.value);
                            } else {
                              setEditingDept(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameDepartment(dept, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingDept(null);
                            }
                          }}
                          autoFocus
                          style={{ fontSize: '1.1rem', padding: '0.5rem' }}
                        />
                      ) : (
                        <>
                          <strong style={{ fontSize: '1.1rem' }}>{dept}</strong>
                          <p style={{ color: '#7f8c8d', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                            {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-small" 
                        onClick={() => setEditingDept(dept)}
                        style={{ backgroundColor: '#3498db', color: 'white' }}
                      >
                        Rename
                      </button>
                      <button 
                        className="btn btn-danger btn-small" 
                        onClick={() => handleDeleteDepartment(dept)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SHIFTS TAB */}
        {activeTab === 'shifts' && (
          <div>
            <h2>{shiftForm.id ? 'Edit Shift' : 'Add New Shift'}</h2>
            <form onSubmit={handleShiftSubmit}>
              <div className="form-group">
                <label>Shift Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={shiftForm.name}
                  onChange={handleShiftChange}
                  placeholder="e.g., Day, Night, Evening"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input 
                    type="time"
                    name="startTime"
                    value={shiftForm.startTime}
                    onChange={handleShiftChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input 
                    type="time"
                    name="endTime"
                    value={shiftForm.endTime}
                    onChange={handleShiftChange}
                    required
                  />
                </div>
              </div>

              {shiftForm.startTime && shiftForm.endTime && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#e8f4f8', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <strong>Duration:</strong> {calculateShiftDuration(shiftForm.startTime, shiftForm.endTime)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {shiftForm.id ? 'Update Shift' : 'Add Shift'}
                </button>
                {shiftForm.id && (
                  <button type="button" className="btn" onClick={resetShiftForm} style={{ backgroundColor: '#95a5a6', color: 'white' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Shift Schedule ({shifts.length})</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {shifts.map(shift => {
                const employeeCount = employees.filter(emp => emp.shift === shift.name).length;
                return (
                  <div key={shift.id} style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <div>
                      <strong style={{ fontSize: '1.2rem', color: '#2c3e50' }}>{shift.name} Shift</strong>
                      <p style={{ color: '#7f8c8d', margin: '0.5rem 0', fontSize: '1rem' }}>
                        {shift.startTime} - {shift.endTime}
                      </p>
                      <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.9rem' }}>
                        Duration: {calculateShiftDuration(shift.startTime, shift.endTime)} • {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-small" 
                        onClick={() => handleEditShift(shift)}
                        style={{ backgroundColor: '#3498db', color: 'white' }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-small" 
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <div>
            <h2>{locationForm.id ? 'Edit Location' : 'Add New Location'}</h2>
            <form onSubmit={handleLocationSubmit}>
              <div className="form-group">
                <label>Location Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={locationForm.name}
                  onChange={handleLocationChange}
                  placeholder="e.g., Main Warehouse, Distribution Center"
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input 
                  type="text"
                  name="address"
                  value={locationForm.address}
                  onChange={handleLocationChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>City *</label>
                  <input 
                    type="text"
                    name="city"
                    value={locationForm.city}
                    onChange={handleLocationChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input 
                    type="text"
                    name="state"
                    value={locationForm.state}
                    onChange={handleLocationChange}
                    placeholder="State (e.g., IL)"
                    maxLength="2"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {locationForm.id ? 'Update Location' : 'Add Location'}
                </button>
                {locationForm.id && (
                  <button type="button" className="btn" onClick={resetLocationForm} style={{ backgroundColor: '#95a5a6', color: 'white' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Warehouse Locations ({locations.length})</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {locations.map(location => {
                const employeeCount = employees.filter(emp => emp.location === location.name).length;
                return (
                  <div key={location.id} style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '1.2rem', color: '#2c3e50' }}>{location.name}</strong>
                        <p style={{ color: '#7f8c8d', margin: '0.5rem 0', fontSize: '1rem' }}>
                          📍 {location.address}, {location.city}, {location.state}
                        </p>
                        <p style={{ color: '#7f8c8d', margin: 0, fontSize: '0.9rem' }}>
                          {employeeCount} employee{employeeCount !== 1 ? 's' : ''} assigned
                        </p>
                      </div>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-small" 
                          onClick={() => handleEditLocation(location)}
                          style={{ backgroundColor: '#3498db', color: 'white' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeManagement;
