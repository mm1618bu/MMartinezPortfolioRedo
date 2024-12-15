#!/bin/bash

# Create the necessary directories
mkdir -p src/components src/data

# Create the LawnCareJobs.js file
cat <<EOL > src/components/LawnCareJobs.js
import React, { useState, useEffect } from 'react';

const LawnCareJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch jobs data
    fetch('/path/to/jobs.json')
      .then(response => response.json())
      .then(data => setJobs(data));

    // Fetch employees data
    fetch('/path/to/employees.json')
      .then(response => response.json())
      .then(data => setEmployees(data));
  }, []);

  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Not Assigned';
  };

  return (
    <div className="lawn-care-jobs">
      <h1>Lawn Care Jobs</h1>
      <table>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Customer Name</th>
            <th>Address</th>
            <th>Town</th>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Cost</th>
            <th>Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{job.customerName}</td>
              <td>{job.address}</td>
              <td>{job.town}</td>
              <td>{job.date}</td>
              <td>{job.time}</td>
              <td>{job.type}</td>
              <td>{job.cost}</td>
              <td>{getEmployeeName(job.assignedTo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LawnCareJobs;
EOL

# Create the LawnCareJobs.css file
cat <<EOL > src/components/LawnCareJobs.css
.lawn-care-jobs {
  font-family: Arial, sans-serif;
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table, th, td {
  border: 1px solid #ddd;
}

th, td {
  padding: 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}
EOL

# Create the jobs.json file (mock data)
cat <<EOL > src/data/jobs.json
[
  {
    "id": 1,
    "customerName": "John Doe",
    "address": "123 Maple St",
    "town": "Springfield",
    "date": "2024-12-20",
    "time": "10:00 AM",
    "type": "Mowing",
    "cost": "$50",
    "assignedTo": 2
  },
  {
    "id": 2,
    "customerName": "Jane Smith",
    "address": "456 Oak St",
    "town": "Springfield",
    "date": "2024-12-21",
    "time": "1:00 PM",
    "type": "Trimming",
    "cost": "$60",
    "assignedTo": 1
  }
]
EOL

# Create the employees.json file (mock data)
cat <<EOL > src/data/employees.json
[
  {
    "id": 1,
    "name": "Alice Johnson"
  },
  {
    "id": 2,
    "name": "Bob Brown"
  }
]
EOL

echo "Setup completed successfully."
