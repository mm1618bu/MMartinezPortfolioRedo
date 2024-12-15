import React, { useState, useEffect } from 'react';
import './LawnCareJobs.css';

const LawnCareJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  // Filter states
  const [filters, setFilters] = useState({
    town: '',
    date: '',
    time: '',
    type: ''
  });

  // Track daily employee assignments
  const [employeeAssignments, setEmployeeAssignments] = useState({});

  useEffect(() => {
    // Fetch jobs data from public directory
    fetch('/jobs.json')
      .then((response) => response.json())
      .then((data) => setJobs(data))
      .catch((error) => console.error('Error fetching jobs:', error));

    // Fetch employees data from public directory
    fetch('/employees.json')
      .then((response) => response.json())
      .then((data) => setEmployees(data))
      .catch((error) => console.error('Error fetching employees:', error));
  }, []); // Only runs once after initial mount

  useEffect(() => {
    if (employees.length && jobs.length) {
      // Auto-assign employees to jobs based on skills, service area, days off, and daily job limit
      const updatedJobs = jobs.map((job) => {
        const assignedEmployees = autoAssignEmployees(job);
        return { ...job, assignedTo: assignedEmployees };
      });
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
    }
  }, [employees, jobs.length]); // Run when employees or jobs are loaded

  useEffect(() => {
    // Filter jobs based on filter criteria
    const filtered = jobs.filter((job) => {
      return (
        (filters.town === '' || job.town.toLowerCase().includes(filters.town.toLowerCase())) &&
        (filters.date === '' || job.date.includes(filters.date)) &&
        (filters.time === '' || job.time.includes(filters.time)) &&
        (filters.type === '' || job.type.toLowerCase().includes(filters.type.toLowerCase()))
      );
    });
    setFilteredJobs(filtered);
  }, [filters, jobs]); // Filtering jobs when filters or jobs change

  const getEmployeeNames = (ids) => {
    // Ensure `ids` is always an array
    const employeeIds = Array.isArray(ids) ? ids : [ids]; // Convert to array if it's not

    return employeeIds
      .map((id) => {
        const employee = employees.find((emp) => emp.id === id);
        return employee ? employee.name : 'Not Assigned';
      })
      .join(', '); // Join names with a comma
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedJobs = [...filteredJobs].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredJobs(sortedJobs);
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleEmployeeSelect = (jobId, selectedEmployees) => {
    // Update the job's assigned employees
    const updatedJobs = jobs.map((job) => {
      if (job.id === jobId) {
        return { ...job, assignedTo: selectedEmployees };
      }
      return job;
    });
    setJobs(updatedJobs);
  };

  const autoAssignEmployees = (job) => {
    const { type, town, date, cost } = job;

    // Determine how many employees can be assigned based on the cost
    let maxEmployees = 1;
    if (cost <= 75) {
      maxEmployees = 1;
    } else if (cost <= 150) {
      maxEmployees = 2;
    } else if (cost <= 225) {
      maxEmployees = 3;
    } else if (cost <= 500) {
      maxEmployees = 4;
    }

    // Filter employees based on matching skills, service area, and availability
    const eligibleEmployees = employees
      .filter((employee) => {
        const isSkillMatch = employee.skills && employee.skills.includes(type);
        const isServiceAreaMatch = employee.serviceArea && employee.serviceArea.includes(town);
        const isAvailable = employee.daysOff && !employee.daysOff.includes(getDayFromDate(date));
        
        return isSkillMatch && isServiceAreaMatch && isAvailable;
      })
      .map((employee) => employee.id); // Return the IDs of matched employees

    // Shuffle the eligible employees array to randomize the assignment
    const shuffledEmployees = shuffleArray(eligibleEmployees);

    // Track daily assignments for each employee
    const employeeAssignmentsForDay = { ...employeeAssignments };

    // Filter out employees who already have 4 assignments on the given day
    const availableEmployees = shuffledEmployees.filter((employeeId) => {
      const employeeDateAssignments = employeeAssignmentsForDay[employeeId] || {};
      const dailyJobs = employeeDateAssignments[getDayFromDate(date)] || 0;

      if (dailyJobs >= 4) {
        return false; // Skip this employee if they're already assigned to 4 jobs that day
      } else {
        // Increment job assignment count for this employee on this day
        if (!employeeDateAssignments[getDayFromDate(date)]) {
          employeeDateAssignments[getDayFromDate(date)] = 0;
        }
        employeeDateAssignments[getDayFromDate(date)] += 1;
        employeeAssignmentsForDay[employeeId] = employeeDateAssignments;
        return true;
      }
    });

    // Update the global assignments state
    setEmployeeAssignments(employeeAssignmentsForDay);

    // Limit the number of employees assigned based on the cost
    return availableEmployees.slice(0, maxEmployees); // Assign a maximum of 'maxEmployees'
  };

  const getDayFromDate = (date) => {
    // Convert date string to a day of the week (e.g., "Monday", "Tuesday")
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = new Date(date).getDay();
    return days[day];
  };

  const shuffleArray = (array) => {
    // Randomly shuffle the array using the Fisher-Yates algorithm
    let shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }
    return shuffledArray;
  };

  const calculateJobCount = () => {
    // Calculate the number of jobs assigned to each employee
    const jobCount = {};
    jobs.forEach((job) => {
      // Ensure assignedTo is always an array
      const assignedEmployees = Array.isArray(job.assignedTo) ? job.assignedTo : [job.assignedTo];

      assignedEmployees.forEach((employeeId) => {
        jobCount[employeeId] = (jobCount[employeeId] || 0) + 1;
      });
    });
    return jobCount;
  };

  const jobCount = calculateJobCount();

  return (
    <div className="lawn-care-jobs">
 <div className="job-count">
  <h2>Employee Job Counts</h2>
  {employees.map((employee) => (
    <span key={employee.id}>
      <span className="employee-name">{employee.name}</span>
      <span className="job-count-number">{jobCount[employee.id] || 0} jobs</span>
    </span>
  ))}
</div>


      {/* Filter Section */}
      <div className="filters">
  <div>
    <label>Town: </label>
    <input
      type="text"
      name="town"
      value={filters.town}
      onChange={handleFilterChange}
      placeholder="Search by town"
    />
  </div>
  <div>
    <label>Date: </label>
    <input
      type="text"
      name="date"
      value={filters.date}
      onChange={handleFilterChange}
      placeholder="Search by date"
    />
  </div>
  <div>
    <label>Time: </label>
    <input
      type="text"
      name="time"
      value={filters.time}
      onChange={handleFilterChange}
      placeholder="Search by time"
    />
  </div>
  <div>
    <label>Type: </label>
    <input
      type="text"
      name="type"
      value={filters.type}
      onChange={handleFilterChange}
      placeholder="Search by type"
    />
  </div>
</div>

      {/* Jobs Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>Job ID</th>
            <th onClick={() => handleSort('customerName')}>Customer Name</th>
            <th onClick={() => handleSort('address')}>Address</th>
            <th onClick={() => handleSort('town')}>Town</th>
            <th onClick={() => handleSort('date')}>Date</th>
            <th onClick={() => handleSort('time')}>Time</th>
            <th onClick={() => handleSort('type')}>Type</th>
            <th onClick={() => handleSort('cost')}>Cost</th>
            <th onClick={() => handleSort('assignedTo')}>Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {filteredJobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{job.customerName}</td>
              <td>{job.address}</td>
              <td>{job.town}</td>
              <td>{job.date}</td>
              <td>{job.time}</td>
              <td>{job.type}</td>
              <td>${job.cost}</td>
              <td>{getEmployeeNames(job.assignedTo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LawnCareJobs;
