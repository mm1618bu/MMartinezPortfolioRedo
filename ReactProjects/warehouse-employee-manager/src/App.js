import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import StaffingLevels from './components/StaffingLevels';
import TimeOffManagement from './components/TimeOffManagement';
import PTOApprovals from './components/PTOApprovals';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import BusRunScheduler from './components/BusRunScheduler';

function App() {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', department: 'Receiving', shift: 'Day', location: 'Main Warehouse', status: 'Active' },
    { id: 2, name: 'Jane Smith', department: 'Packing', shift: 'Night', location: 'Main Warehouse', status: 'Active' },
    { id: 3, name: 'Mike Johnson', department: 'Shipping', shift: 'Day', location: 'Distribution Center', status: 'Active' },
    { id: 4, name: 'Sarah Williams', department: 'Receiving', shift: 'Night', location: 'Main Warehouse', status: 'Active' },
    { id: 5, name: 'Tom Brown', department: 'Packing', shift: 'Day', location: 'Distribution Center', status: 'Active' },
  ]);

  const [timeOffRequests, setTimeOffRequests] = useState([
    { id: 1, employeeId: 1, employeeName: 'John Doe', type: 'PTO', date: '2025-01-15', status: 'Pending' },
    { id: 2, employeeId: 2, employeeName: 'Jane Smith', type: 'PTO', date: '2025-01-20', status: 'Pending' },
  ]);

  const [vetRequests, setVetRequests] = useState([]);

  const addTimeOffRequest = (request) => {
    const newRequest = {
      ...request,
      id: timeOffRequests.length + 1,
      status: request.type === 'PTO' ? 'Pending' : 'Approved',
    };
    setTimeOffRequests([...timeOffRequests, newRequest]);
  };

  const addVetRequest = (request) => {
    const newRequest = {
      ...request,
      id: vetRequests.length + 1,
      status: 'Scheduled',
    };
    setVetRequests([...vetRequests, newRequest]);
  };

  const updateRequestStatus = (id, status) => {
    setTimeOffRequests(
      timeOffRequests.map((req) =>
        req.id === id ? { ...req, status } : req
      )
    );
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">Warehouse Employee Manager</h1>
            <ul className="nav-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/staffing">Staffing Levels</Link></li>
              <li><Link to="/employees">Employee Management</Link></li>
              <li><Link to="/timeoff">Time Management</Link></li>
              <li><Link to="/pto-approvals">PTO Approvals</Link></li>
            </ul>
          </div>
        </nav>

        <div className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  employees={employees} 
                  timeOffRequests={timeOffRequests} 
                />
              } 
            />
            <Route 
              path="/staffing" 
              element={<StaffingLevels employees={employees} />} 
            />
            <Route 
              path="/employees" 
              element={
                <EmployeeManagement 
                  employees={employees} 
                  setEmployees={setEmployees}
                />
              } 
            />
            <Route 
              path="/timeoff" 
              element={
                <TimeOffManagement 
                  employees={employees} 
                  onAddRequest={addTimeOffRequest}
                  onAddVet={addVetRequest}
                  vetRequests={vetRequests}
                />
              } 
            />
            <Route 
              path="/pto-approvals" 
              element={
                <PTOApprovals 
                  requests={timeOffRequests.filter(req => req.type === 'PTO')} 
                  onUpdateStatus={updateRequestStatus} 
                />
              } 
            />
            <Route 
              path="/bus"
              element={<BusRunScheduler/>}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
