import React, { useState } from "react";
import employeesData from "./data/employees.json"; // Ensure correct path
import jobsData from "./data/jobs.json"; // Ensure correct path
import "./App.css";

const JobAssignment = () => {
  const [employees] = useState(employeesData); // Static employees from JSON
  const [jobs, setJobs] = useState(jobsData); // Static jobs from JSON
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filters, setFilters] = useState({
    Name: "",
    YardSize: "",
    Date: "",
    Time: "",
    AssignedEmployees: "",
  });

  const assignJobsToEmployees = () => {
    const dailyJobCount = employees.reduce((acc, emp) => {
      acc[emp.Name] = {}; // Initialize daily job counts for each employee
      return acc;
    }, {});
  
    const updatedJobs = jobs.map((job) => {
      const { Vehicle, YardSize, Date: jobDateStr, Location } = job;
  
      // Determine how many employees are needed
      const requiredEmployees = { Small: 1, Medium: 2, Large: 2 }[YardSize] || 1;
  
      // Get the day of the week from the job date
      const jobDate = new Date(jobDateStr);
      if (isNaN(jobDate)) {
        console.error(`Invalid date: ${jobDateStr}`);
        return job; // Skip this job if the date is invalid
      }
      const dayOfWeek = jobDate.toLocaleString('en-US', { weekday: 'long' });
  
      // Filter eligible employees
      let eligibleEmployees = employees.filter((emp) => {
        const hasVehicle = !Vehicle || emp.Car === true; // Correctly use `Vehicle`
        const dailyCount = dailyJobCount[emp.Name][jobDateStr] || 0;
        const isInLocation = emp.Town && emp.Town.includes(Location); // Check if employee's towns include the job location
        const isDayOff = emp["Days Off"] && emp["Days Off"].includes(dayOfWeek); // Check if the job date is a day off
  
        return hasVehicle && dailyCount < 2 && isInLocation && !isDayOff; // Check all conditions
      });
  
      // Sort eligible employees by seniority and customer rating
      eligibleEmployees.sort((a, b) => {
        if (a.seniority === b.seniority) {
          return b.customerRating - a.customerRating; // Higher rating first
        }
        return b.seniority - a.seniority; // Higher seniority first
      });
  
      // Assign required employees to the job
      const assignedEmployees = eligibleEmployees.slice(0, requiredEmployees).map(emp => emp.Name);
  
      // Update daily job count for assigned employees
      assignedEmployees.forEach(empName => {
        dailyJobCount[empName][jobDateStr] = (dailyJobCount[empName][jobDateStr] || 0) + 1;
      });
  
      return {
        ...job,
        AssignedEmployees: assignedEmployees, // Ensure this is an array
      };
    });
  
    setJobs(updatedJobs);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredJobs = sortedJobs.filter((job) => {
    return (
      job.Name.toLowerCase().includes(filters.Name.toLowerCase()) &&
      job.YardSize.toLowerCase().includes(filters.YardSize.toLowerCase()) &&
      job.Date.toLowerCase().includes(filters.Date.toLowerCase()) &&
      job.Time.toLowerCase().includes(filters.Time.toLowerCase()) &&
      (filters.AssignedEmployees === "" || job.AssignedEmployees.some(emp => emp.toLowerCase().includes(filters.AssignedEmployees.toLowerCase())))
    );
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const getJobCountForEmployees = () => {
    const jobCount = employees.reduce((acc, emp) => {
      acc[emp.Name] = 0;
      return acc;
    }, {});

    jobs.forEach((job) => {
      job.AssignedEmployees?.forEach((empName) => {
        if (jobCount[empName] !== undefined) {
          jobCount[empName] += 1;
        }
      });
    });

    return jobCount;
  };

  const jobCount = getJobCountForEmployees();

  return (
    <div className="job-assignment-container">
      <h1>Active Jobs</h1>
      <button onClick={assignJobsToEmployees} className="assign-button">
        Assign Jobs
      </button>
      <div className="employees-list">
        <h2>Employees</h2>
        <ul>
          {employees.map((employee) => (
            <li key={employee.Name} className="EmployeeItem">
              {employee.Name} <br/>{jobCount[employee.Name]} Assigned Jobs
            </li>
          ))}
        </ul>
      </div>
      <div className="jobs-list">
        <h2>Jobs</h2>
        <table>
          <thead>
            <tr>
              <th>
                <div onClick={() => requestSort("Name")}>Name</div>
                <input
                  type="text"
                  name="Name"
                  value={filters.Name}
                  onChange={handleFilterChange}
                  placeholder="Filter by Name"
                />
              </th>
              <th>
                <div onClick={() => requestSort("YardSize")}>Yard Size</div>
                <input
                  type="text"
                  name="YardSize"
                  value={filters.YardSize}
                  onChange={handleFilterChange}
                  placeholder="Filter by Yard Size"
                />
              </th>
              <th>
                <div onClick={() => requestSort("Date")}>Date</div>
                <input
                  type="text"
                  name="Date"
                  value={filters.Date}
                  onChange={handleFilterChange}
                  placeholder="Filter by Date"
                />
              </th>
              <th>
                <div onClick={() => requestSort("Time")}>Time</div>
                <input
                  type="text"
                  name="Time"
                  value={filters.Time}
                  onChange={handleFilterChange}
                  placeholder="Filter by Time"
                />
              </th>
              <th>
                <div onClick={() => requestSort("AssignedEmployees")}>Assigned Employees</div>
                <input
                  type="text"
                  name="AssignedEmployees"
                  value={filters.AssignedEmployees}
                  onChange={handleFilterChange}
                  placeholder="Filter by Assigned Employees"
                />
                </th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job, index) => (
              <tr key={index}>
                <td>{job.Name}</td>
                <td>{job.YardSize} yard</td>
                <td>{job.Date}</td>
                <td>{job.Time}</td>
                <td>{job.AssignedEmployees?.join(", ") || "Flex"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobAssignment;