import React from "react";
import employees from "./employees.json"; // Adjust the path as necessary
import "./EmployeeList.css"; // Import the CSS file

const EmployeeList = () => {
  return (
    <ul>
      {employees.map((employee, index) => (
        <li key={index}>
          <strong>Name:</strong> {employee.name} <br />
          <strong>Skills:</strong> {Array.isArray(employee.skills) ? employee.skills.join(", ") : employee.skills} <br />
          <strong>Location:</strong>
          <ul>
            {Array.isArray(employee.location) ? (
              employee.location.map((loc, locIndex) => <li key={locIndex}>{loc}</li>)
            ) : (
              <li>{employee.location}</li>
            )}
          </ul>
          <strong>Seniority:</strong> {employee.seniority} years <br />
          <strong>CSAT Score:</strong> {employee.csatScore}% <br />
          <strong>Days Off:</strong> {employee.daysOff.join(", ")}
        </li>
      ))}
    </ul>
  );
};

export default EmployeeList;