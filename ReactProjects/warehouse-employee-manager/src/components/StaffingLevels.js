import React, { useState } from 'react';

function StaffingLevels({ employees }) {
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', or 'metrics'
  
  // Site metrics state - location specific
  const [locationMetrics, setLocationMetrics] = useState({
    'Main Warehouse': {
      expectedVolume: 10000,
      unitsPerHourPerPerson: 100,
      shiftHours: 8,
      departments: {
        Receiving: { percentage: 25 },
        Packing: { percentage: 40 },
        Shipping: { percentage: 25 },
        'Quality Control': { percentage: 10 }
      }
    },
    'Distribution Center': {
      expectedVolume: 8000,
      unitsPerHourPerPerson: 120,
      shiftHours: 8,
      departments: {
        Receiving: { percentage: 20 },
        Packing: { percentage: 35 },
        Shipping: { percentage: 35 },
        'Quality Control': { percentage: 10 }
      }
    }
  });
  
  const [selectedMetricsLocation, setSelectedMetricsLocation] = useState('Main Warehouse');
  const [editingMetrics, setEditingMetrics] = useState(false);

  const locations = ['All', ...new Set(employees.map(emp => emp.location).filter(Boolean))];
  const departments = ['All', ...new Set(employees.map(emp => emp.department))];
  const shifts = ['All', ...new Set(employees.map(emp => emp.shift))];

  const filteredEmployees = employees.filter(emp => {
    const locationMatch = selectedLocation === 'All' || emp.location === selectedLocation;
    const deptMatch = filterDepartment === 'All' || emp.department === filterDepartment;
    const shiftMatch = filterShift === 'All' || emp.shift === filterShift;
    return locationMatch && deptMatch && shiftMatch;
  });

  const getStaffingByLocation = () => {
    const staffing = {};
    locations.filter(l => l !== 'All').forEach(location => {
      const locationEmployees = employees.filter(emp => emp.location === location && emp.status === 'Active');
      const departments = {};
      const shifts = {};
      
      locationEmployees.forEach(emp => {
        departments[emp.department] = (departments[emp.department] || 0) + 1;
        shifts[emp.shift] = (shifts[emp.shift] || 0) + 1;
      });
      
      staffing[location] = {
        total: locationEmployees.length,
        departments,
        shifts,
      };
    });
    return staffing;
  };

  const getLocationStaffingByDept = (location) => {
    const staffing = {};
    departments.filter(d => d !== 'All').forEach(dept => {
      staffing[dept] = employees.filter(emp => 
        emp.location === location && emp.department === dept && emp.status === 'Active'
      ).length;
    });
    return staffing;
  };

  const getLocationStaffingByShift = (location) => {
    const staffing = {};
    shifts.filter(s => s !== 'All').forEach(shift => {
      staffing[shift] = employees.filter(emp => 
        emp.location === location && emp.shift === shift && emp.status === 'Active'
      ).length;
    });
    return staffing;
  };

  const getStaffingLevel = (count, type = 'total') => {
    // Thresholds for staffing levels
    const thresholds = {
      total: { low: 3, medium: 5 },
      department: { low: 1, medium: 3 },
      shift: { low: 2, medium: 4 }
    };
    
    const t = thresholds[type];
    if (count <= t.low) return { level: 'low', color: '#e74c3c', text: 'Low' };
    if (count <= t.medium) return { level: 'medium', color: '#f39c12', text: 'Medium' };
    return { level: 'good', color: '#27ae60', text: 'Good' };
  };

  const staffingByLocation = getStaffingByLocation();

  const calculateRequiredStaffing = (location) => {
    const metrics = locationMetrics[location];
    if (!metrics) return { total: 0, departments: {} };
    
    const totalUnitsPerShift = metrics.expectedVolume;
    const unitsPerPerson = metrics.unitsPerHourPerPerson * metrics.shiftHours;
    const totalRequired = Math.ceil(totalUnitsPerShift / unitsPerPerson);
    
    const byDepartment = {};
    Object.entries(metrics.departments).forEach(([dept, config]) => {
      byDepartment[dept] = Math.ceil((totalRequired * config.percentage) / 100);
    });
    
    return { total: totalRequired, departments: byDepartment };
  };

  const getStaffingComparison = () => {
    const comparison = {};
    locations.filter(l => l !== 'All').forEach(location => {
      const required = calculateRequiredStaffing(location);
      const actual = staffingByLocation[location];
      const metrics = locationMetrics[location];
      
      if (!metrics || !actual) return;
      
      const deptComparison = {};
      Object.keys(metrics.departments).forEach(dept => {
        const requiredCount = required.departments[dept] || 0;
        const actualCount = actual.departments[dept] || 0;
        deptComparison[dept] = {
          required: requiredCount,
          actual: actualCount,
          difference: actualCount - requiredCount,
          status: actualCount >= requiredCount ? 'adequate' : 'understaffed'
        };
      });
      
      comparison[location] = {
        total: {
          required: required.total,
          actual: actual.total,
          difference: actual.total - required.total,
          status: actual.total >= required.total ? 'adequate' : 'understaffed'
        },
        departments: deptComparison
      };
    });
    return comparison;
  };

  const handleMetricChange = (field, value) => {
    setLocationMetrics({
      ...locationMetrics,
      [selectedMetricsLocation]: {
        ...locationMetrics[selectedMetricsLocation],
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleDepartmentPercentageChange = (dept, value) => {
    setLocationMetrics({
      ...locationMetrics,
      [selectedMetricsLocation]: {
        ...locationMetrics[selectedMetricsLocation],
        departments: {
          ...locationMetrics[selectedMetricsLocation].departments,
          [dept]: { percentage: parseFloat(value) || 0 }
        }
      }
    });
  };

  const getTotalPercentage = () => {
    const metrics = locationMetrics[selectedMetricsLocation];
    if (!metrics) return 0;
    return Object.values(metrics.departments).reduce((sum, dept) => sum + dept.percentage, 0);
  };

  const initializeLocationMetrics = (location) => {
    if (!locationMetrics[location]) {
      setLocationMetrics({
        ...locationMetrics,
        [location]: {
          expectedVolume: 10000,
          unitsPerHourPerPerson: 100,
          shiftHours: 8,
          departments: {
            Receiving: { percentage: 25 },
            Packing: { percentage: 40 },
            Shipping: { percentage: 25 },
            'Quality Control': { percentage: 10 }
          }
        }
      });
    }
  };

  return (
    <div>
      <h1 className="page-title">Staffing Levels Dashboard</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setViewMode('overview')}
              className="btn btn-small"
              style={{
                backgroundColor: viewMode === 'overview' ? '#3498db' : '#95a5a6',
                color: 'white'
              }}
            >
              Overview
            </button>
            <button 
              onClick={() => setViewMode('detailed')}
              className="btn btn-small"
              style={{
                backgroundColor: viewMode === 'detailed' ? '#3498db' : '#95a5a6',
                color: 'white'
              }}
            >
              Detailed View
            </button>
            <button 
              onClick={() => setViewMode('metrics')}
              className="btn btn-small"
              style={{
                backgroundColor: viewMode === 'metrics' ? '#3498db' : '#95a5a6',
                color: 'white'
              }}
            >
              📊 Metrics & Planning
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc === 'All' ? 'All Locations' : loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* OVERVIEW MODE */}
        {viewMode === 'overview' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Location Staffing Overview</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {Object.entries(staffingByLocation).map(([location, data]) => {
                const staffingLevel = getStaffingLevel(data.total, 'total');
                return (
                  <div 
                    key={location} 
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: `3px solid ${staffingLevel.color}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onClick={() => setSelectedLocation(location)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.4rem', color: '#2c3e50', marginBottom: '0.25rem' }}>
                          📍 {location}
                        </h3>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: staffingLevel.color,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}>
                          {staffingLevel.text} Staffing
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: staffingLevel.color }}>
                          {data.total}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Active Employees</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                      <div>
                        <h4 style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                          By Department
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {Object.entries(data.departments).map(([dept, count]) => {
                            const deptLevel = getStaffingLevel(count, 'department');
                            return (
                              <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.95rem' }}>{dept}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: deptLevel.color
                                  }} />
                                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{count}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                          By Shift
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {Object.entries(data.shifts).map(([shift, count]) => {
                            const shiftLevel = getStaffingLevel(count, 'shift');
                            return (
                              <div key={shift} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.95rem' }}>{shift}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: shiftLevel.color
                                  }} />
                                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{count}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              borderLeft: '4px solid #3498db'
            }}>
              <h4 style={{ marginBottom: '0.5rem' }}>📊 Staffing Legend</h4>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27ae60' }} />
                  <span>Good Staffing</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f39c12' }} />
                  <span>Medium Staffing</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e74c3c' }} />
                  <span>Low Staffing - Action Needed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* METRICS & PLANNING MODE */}
        {viewMode === 'metrics' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Site Metrics & Staffing Requirements</h2>
            
            <div className="card" style={{ backgroundColor: '#f8f9fa', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3>Configure Site Metrics</h3>
                  <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '0.25rem' }}>Set operational metrics for each warehouse location</p>
                </div>
                <button 
                  onClick={() => setEditingMetrics(!editingMetrics)}
                  className="btn btn-small"
                  style={{ backgroundColor: '#3498db', color: 'white' }}
                >
                  {editingMetrics ? '🔒 Lock Metrics' : '✏️ Edit Metrics'}
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label><strong>Select Location to Configure</strong></label>
                <select 
                  value={selectedMetricsLocation} 
                  onChange={(e) => {
                    setSelectedMetricsLocation(e.target.value);
                    initializeLocationMetrics(e.target.value);
                  }}
                  style={{ fontSize: '1rem', padding: '0.75rem' }}
                >
                  {locations.filter(l => l !== 'All').map(loc => (
                    <option key={loc} value={loc}>📍 {loc}</option>
                  ))}
                </select>
              </div>
              
              {locationMetrics[selectedMetricsLocation] && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Expected Daily Volume (units)</label>
                      <input 
                        type="number"
                        value={locationMetrics[selectedMetricsLocation].expectedVolume}
                        onChange={(e) => handleMetricChange('expectedVolume', e.target.value)}
                        disabled={!editingMetrics}
                        style={{ backgroundColor: editingMetrics ? 'white' : '#e9ecef' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Units per Hour (per person)</label>
                      <input 
                        type="number"
                        value={locationMetrics[selectedMetricsLocation].unitsPerHourPerPerson}
                        onChange={(e) => handleMetricChange('unitsPerHourPerPerson', e.target.value)}
                        disabled={!editingMetrics}
                        style={{ backgroundColor: editingMetrics ? 'white' : '#e9ecef' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Shift Hours</label>
                      <input 
                        type="number"
                        value={locationMetrics[selectedMetricsLocation].shiftHours}
                        onChange={(e) => handleMetricChange('shiftHours', e.target.value)}
                        disabled={!editingMetrics}
                        style={{ backgroundColor: editingMetrics ? 'white' : '#e9ecef' }}
                      />
                    </div>
                  </div>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Department Distribution</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(locationMetrics[selectedMetricsLocation].departments).map(([dept, config]) => (
                      <div key={dept} className="form-group">
                        <label>{dept} (%)</label>
                        <input 
                          type="number"
                          value={config.percentage}
                          onChange={(e) => handleDepartmentPercentageChange(dept, e.target.value)}
                          disabled={!editingMetrics}
                          min="0"
                          max="100"
                          style={{ backgroundColor: editingMetrics ? 'white' : '#e9ecef' }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: getTotalPercentage() === 100 ? '#d4edda' : '#fff3cd',
                borderRadius: '4px'
              }}>
                <strong>Total: {getTotalPercentage()}%</strong>
                {getTotalPercentage() !== 100 && <span style={{ marginLeft: '1rem', color: '#856404' }}>⚠️ Should equal 100%</span>}
              </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Staffing Analysis by Location</h3>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {Object.entries(getStaffingComparison()).map(([location, comparison]) => (
                <div key={location} style={{
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: `3px solid ${comparison.total.status === 'adequate' ? '#27ae60' : '#e74c3c'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.4rem', color: '#2c3e50', marginBottom: '1rem' }}>
                    📍 {location}
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>Required Staff</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3498db' }}>{comparison.total.required}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>Current Staff</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50' }}>{comparison.total.actual}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>Difference</div>
                      <div style={{ 
                        fontSize: '1.8rem', 
                        fontWeight: 'bold', 
                        color: comparison.total.difference >= 0 ? '#27ae60' : '#e74c3c' 
                      }}>
                        {comparison.total.difference > 0 ? '+' : ''}{comparison.total.difference}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>Status</div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'bold',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        backgroundColor: comparison.total.status === 'adequate' ? '#d4edda' : '#f8d7da',
                        color: comparison.total.status === 'adequate' ? '#155724' : '#721c24',
                        textAlign: 'center'
                      }}>
                        {comparison.total.status === 'adequate' ? '✓ Adequate' : '⚠ Understaffed'}
                      </div>
                    </div>
                  </div>

                  <h4 style={{ marginBottom: '0.75rem', color: '#7f8c8d', fontSize: '0.9rem', textTransform: 'uppercase' }}>Department Breakdown</h4>
                  <table className="table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Required</th>
                        <th>Current</th>
                        <th>Difference</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(comparison.departments).map(([dept, data]) => (
                        <tr key={dept} style={{ backgroundColor: data.status === 'adequate' ? '#f8f9fa' : '#fff3cd' }}>
                          <td><strong>{dept}</strong></td>
                          <td>{data.required}</td>
                          <td>{data.actual}</td>
                          <td style={{ 
                            color: data.difference >= 0 ? '#27ae60' : '#e74c3c',
                            fontWeight: 'bold'
                          }}>
                            {data.difference > 0 ? '+' : ''}{data.difference}
                          </td>
                          <td>
                            <span className={`badge badge-${data.status === 'adequate' ? 'approved' : 'pending'}`}>
                              {data.status === 'adequate' ? '✓ OK' : '⚠ Need ' + Math.abs(data.difference)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {comparison.total.status === 'understaffed' && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      borderLeft: '4px solid #f39c12'
                    }}>
                      <strong style={{ color: '#856404' }}>💡 Recommendation:</strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#856404' }}>
                        Need to hire {Math.abs(comparison.total.difference)} more employee{Math.abs(comparison.total.difference) > 1 ? 's' : ''} or schedule VET to meet target volume.
                      </p>
                    </div>
                  )}
                  
                  {comparison.total.difference > 0 && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#d4edda',
                      borderRadius: '4px',
                      borderLeft: '4px solid #27ae60'
                    }}>
                      <strong style={{ color: '#155724' }}>✓ Status:</strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#155724' }}>
                        Staffing is adequate with {comparison.total.difference} extra employee{comparison.total.difference > 1 ? 's' : ''}. Consider VTO if volume decreases.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETAILED VIEW MODE */}
        {viewMode === 'detailed' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                <label>Filter by Department</label>
                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                <label>Filter by Shift</label>
                <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
                  {shifts.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
              <strong>Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}</strong>
              {selectedLocation !== 'All' && <span> at {selectedLocation}</span>}
              {filterDepartment !== 'All' && <span> in {filterDepartment}</span>}
              {filterShift !== 'All' && <span> on {filterShift} shift</span>}
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Location</th>
                  <th>Department</th>
                  <th>Shift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📍 {employee.location || 'N/A'}
                      </span>
                    </td>
                    <td>{employee.department}</td>
                    <td>{employee.shift}</td>
                    <td>
                      <span className={`badge badge-${employee.status.toLowerCase().replace(' ', '-')}`}>
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                No employees match the selected filters.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Card */}
      <div className="card">
        <h2>📋 Workforce Insights</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {Object.entries(staffingByLocation).map(([location, data]) => {
            const lowDepts = Object.entries(data.departments).filter(([, count]) => 
              getStaffingLevel(count, 'department').level === 'low'
            );
            const lowShifts = Object.entries(data.shifts).filter(([, count]) => 
              getStaffingLevel(count, 'shift').level === 'low'
            );
            
            if (lowDepts.length === 0 && lowShifts.length === 0) return null;
            
            return (
              <div key={location} style={{ 
                padding: '1rem', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px',
                borderLeft: '4px solid #f39c12'
              }}>
                <strong style={{ color: '#856404' }}>⚠️ {location}</strong>
                <ul style={{ marginTop: '0.5rem', marginBottom: 0, color: '#856404' }}>
                  {lowDepts.map(([dept, count]) => (
                    <li key={dept}>{dept} department is understaffed ({count} employees)</li>
                  ))}
                  {lowShifts.map(([shift, count]) => (
                    <li key={shift}>{shift} shift is understaffed ({count} employees)</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {Object.values(staffingByLocation).every(data => {
            const lowDepts = Object.entries(data.departments).filter(([, count]) => 
              getStaffingLevel(count, 'department').level === 'low'
            );
            const lowShifts = Object.entries(data.shifts).filter(([, count]) => 
              getStaffingLevel(count, 'shift').level === 'low'
            );
            return lowDepts.length === 0 && lowShifts.length === 0;
          }) && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px',
              borderLeft: '4px solid #27ae60',
              textAlign: 'center'
            }}>
              <strong style={{ color: '#155724' }}>✅ All locations are adequately staffed!</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffingLevels;
