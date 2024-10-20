import React, { useState, useCallback } from 'react';
import employees from './employees.json';
import './Scheduler.css';

const jobs = [
    { name: "Lawn Care - Quincy", location: "Quincy", skill: "clean up", price: 105, date: "2024-10-30" },
    { name: "Tree Pruning - Weymouth", location: "Weymouth", skill: "leaf raking", price: 210, date: "2024-10-31" },
    { name: "Hedge Trimming - Hingham", location: "Hingham", skill: "clean up", price: 145, date: "2024-11-01" },
    { name: "Garden Maintenance - Quincy", location: "Quincy", skill: "leaf raking", price: 100, date: "2024-11-02" },
    { name: "Lawn Aeration - Weymouth", location: "Weymouth", skill: "clean up", price: 170, date: "2024-11-03" },
    { name: "Lawn Care - Hingham", location: "Hingham", skill: "leaf raking", price: 125, date: "2024-11-04" },
    { name: "Tree Pruning - Quincy", location: "Quincy", skill: "clean up", price: 95, date: "2024-11-05" },
    { name: "Hedge Trimming - Braintree", location: "Braintree", skill: "clean up", price: 205, date: "2024-11-06" },
    { name: "Garden Maintenance - Weymouth", location: "Weymouth", skill: "leaf raking", price: 135, date: "2024-11-07" },
    { name: "Lawn Care - Hingham", location: "Hingham", skill: "leaf raking", price: 115, date: "2024-11-08" },
    { name: "Tree Pruning - Braintree", location: "Braintree", skill: "clean up", price: 150, date: "2024-11-09" },
    { name: "Hedge Trimming - Weymouth", location: "Weymouth", skill: "clean up", price: 110, date: "2024-11-10" },
    { name: "Lawn Aeration - Hingham", location: "Hingham", skill: "leaf raking", price: 160, date: "2024-11-11" },
    { name: "Garden Maintenance - Quincy", location: "Quincy", skill: "leaf raking", price: 120, date: "2024-11-12" },
    { name: "Lawn Care - Weymouth", location: "Weymouth", skill: "clean up", price: 90, date: "2024-11-13" },
    { name: "Tree Pruning - Hingham", location: "Hingham", skill: "leaf raking", price: 220, date: "2024-11-14" },
    { name: "Hedge Trimming - Braintree", location: "Braintree", skill: "clean up", price: 140, date: "2024-11-15" },
    { name: "Garden Maintenance - Weymouth", location: "Weymouth", skill: "clean up", price: 150, date: "2024-11-16" },
    { name: "Lawn Care - Quincy", location: "Quincy", skill: "clean up", price: 105, date: "2024-11-17" },
    { name: "Lawn Aeration - Braintree", location: "Braintree", skill: "leaf raking", price: 175, date: "2024-11-18" },
    { name: "Lawn Care - Hingham", location: "Hingham", skill: "leaf raking", price: 125, date: "2024-11-19" },
    { name: "Tree Pruning - Quincy", location: "Quincy", skill: "clean up", price: 200, date: "2024-11-20" },
    { name: "Hedge Trimming - Weymouth", location: "Weymouth", skill: "leaf raking", price: 130, date: "2024-11-21" },
    { name: "Garden Maintenance - Hingham", location: "Hingham", skill: "clean up", price: 95, date: "2024-11-22" },
    { name: "Lawn Care - Braintree", location: "Braintree", skill: "leaf raking", price: 110, date: "2024-11-23" },
    { name: "Tree Pruning - Weymouth", location: "Weymouth", skill: "clean up", price: 220, date: "2024-11-24" },
    { name: "Hedge Trimming - Quincy", location: "Quincy", skill: "leaf raking", price: 150, date: "2024-11-25" },
    { name: "Lawn Care - Hingham", location: "Hingham", skill: "clean up", price: 95, date: "2024-11-26" },
    { name: "Lawn Aeration - Weymouth", location: "Weymouth", skill: "leaf raking", price: 160, date: "2024-11-27" },
    { name: "Garden Maintenance - Braintree", location: "Braintree", skill: "clean up", price: 120, date: "2024-11-28" },
    { name: "Lawn Care - Quincy", location: "Quincy", skill: "clean up", price: 105, date: "2024-11-29" },
    { name: "Tree Pruning - Hingham", location: "Hingham", skill: "leaf raking", price: 230, date: "2024-11-30" },
    { name: "Hedge Trimming - Weymouth", location: "Weymouth", skill: "clean up", price: 140, date: "2024-12-01" },
    { name: "Garden Maintenance - Quincy", location: "Quincy", skill: "leaf raking", price: 115, date: "2024-12-02" },
    { name: "Lawn Care - Braintree", location: "Braintree", skill: "clean up", price: 100, date: "2024-12-03" },
    { name: "Tree Pruning - Weymouth", location: "Weymouth", skill: "leaf raking", price: 210, date: "2024-12-04" },
    { name: "Hedge Trimming - Hingham", location: "Hingham", skill: "clean up", price: 135, date: "2024-12-05" },
    { name: "Garden Maintenance - Braintree", location: "Braintree", skill: "leaf raking", price: 125, date: "2024-12-06" },
    { name: "Lawn Care - Weymouth", location: "Weymouth", skill: "clean up", price: 95, date: "2024-12-07" },
    { name: "Tree Pruning - Quincy", location: "Quincy", skill: "clean up", price: 200, date: "2024-12-08" },
    { name: "Hedge Trimming - Braintree", location: "Braintree", skill: "clean up", price: 130, date: "2024-12-09" },
    { name: "Lawn Care - Hingham", location: "Hingham", skill: "leaf raking", price: 110, date: "2024-12-10" },
    { name: "Garden Maintenance - Weymouth", location: "Weymouth", skill: "clean up", price: 140, date: "2024-12-11" }
]
  

const Scheduler = () => {
  const [assignments, setAssignments] = useState([]);

  // Memoize the job assignment function with stricter rules
  const assignJobs = useCallback(() => {
    function assignedJobs(jobs) {
      let employeeIndex = 0;

      jobs.forEach(job => {
        const { location, skill, date } = job;

        // Find eligible employees
        const eligibleEmployees = employees.filter(employee => {
          const hasRequiredSkill = employee.skills.includes(skill);
          const isInLocation = Array.isArray(employee.location)
            ? employee.location.includes(location)
            : employee.location === location;
          const isAvailable = !employee.daysOff.includes(date);

          return hasRequiredSkill && isInLocation && isAvailable;
        });

        // Assign job if there are eligible employees
        if (eligibleEmployees.length > 0) {
          console.log(`Assigning job: ${JSON.stringify(job)}`);
          // Round-robin assignment
          const assignedEmployee = eligibleEmployees[employeeIndex % eligibleEmployees.length];
          employeeIndex++;

          console.log(`Job assigned to: ${assignedEmployee.name}`);
          setAssignments(prevAssignments => [
            ...prevAssignments,
            { ...job, assignedEmployee: assignedEmployee.name }
          ]);
        } else {
          console.log(`No eligible employees for job: ${JSON.stringify(job)}`);
        }
      });
    }

    assignedJobs(jobs);
  }, []);

  return (
    <div>
      <button onClick={assignJobs}>Assign Jobs</button>
      <ul>
        {assignments.map((assignment, index) => (
          <li key={index}>
            {assignment.name} assigned to <b>{assignment.assignedEmployee}</b> : {assignment.location} : {assignment.date} : ${assignment.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scheduler;