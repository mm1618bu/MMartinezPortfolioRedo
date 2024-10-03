import React, { useState } from 'react';
import './App.css';
import AddStudent from './AddStudent';  // Import the new component

function App() {
  const initialStudents = [
    { id: 1, name: 'Tomas Alvarez', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 2, name: 'Donna Callahan', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 3, name: 'Heber Cruz', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 4, name: 'Jenny Chang', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 5, name: 'Samuel Lee', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 6, name: 'Linda Johnson', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 7, name: 'Derek Smith', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } },
    { id: 8, name: 'Sara Davis', grades: { attendance: 0, week1: 0, neoRealism: 0, week2: 0, week3: 0, kurosawa: 0 } }
  ];

  const [students, setStudents] = useState(initialStudents);
  const assignmentNames = ['attendance', 'week1', 'neoRealism', 'week2', 'week3', 'kurosawa'];

  // Function to add a student
  const addStudent = (newStudent) => {
    setStudents([...students, newStudent]);
  };

  const handleGradeChange = (studentId, assignment, event) => {
    const newGrade = event.target.value;
    const updatedStudents = students.map((student) => {
      if (student.id === studentId) {
        return {
          ...student,
          grades: {
            ...student.grades,
            [assignment]: newGrade
          }
        };
      }
      return student;
    });
    setStudents(updatedStudents);
  };

  const calculateFinalGrade = (grades) => {
    const totalGrades = Object.values(grades).map((grade) => parseFloat(grade) || 0);
    const sum = totalGrades.reduce((acc, curr) => acc + curr, 0);
    return totalGrades.length ? (sum / totalGrades.length).toFixed(2) : 'N/A';
  };

  // Calculate the average for a given assignment
  const calculateAverage = (assignment) => {
    const validGrades = students
      .map(student => parseFloat(student.grades[assignment]) || 0)
      .filter(grade => grade > 0);
    const sum = validGrades.reduce((acc, curr) => acc + curr, 0);
    return validGrades.length ? (sum / validGrades.length).toFixed(2) : '0';
  };

  // Calculate the range for a given assignment
  const calculateRange = (assignment) => {
    const validGrades = students
      .map(student => parseFloat(student.grades[assignment]) || 0)
      .filter(grade => grade > 0);
    const max = Math.max(...validGrades);
    const min = Math.min(...validGrades);
    return validGrades.length ? `${min.toFixed(2)} - ${max.toFixed(2)}` : '0';
  };

  return (
    <div className="App">
      <h1>Gradebook</h1>
      <br></br>
      {/* Add the AddStudent component and pass down the function */}
      <AddStudent onAddStudent={addStudent} />
      <br></br>
      <table className="gradebook-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Final Grade</th>
            <th>Participation</th>
            <th>Quiz 1</th>
            <th>Midterm Exam</th>
            <th>Week 4 Reading</th>
            <th>Group Project</th>
            <th>Final Paper</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{calculateFinalGrade(student.grades)}%</td>
              {assignmentNames.map((assignment, index) => (
                <td key={index}>
                  <input
                    value={student.grades[assignment] || ''}
                    onChange={(event) => handleGradeChange(student.id, assignment, event)}
                  />
                </td>
              ))}
            </tr>
          ))}
          
          {/* Row for showing average and range */}
          <tr className="summary-row">
            <td>Average</td>
            <td>N/A</td>
            {assignmentNames.map((assignment, index) => (
              <td key={index}>
                {calculateAverage(assignment)}
              </td>
            ))}
          </tr>
          <tr className="summary-row">
            <td>Range</td>
            <td>N/A</td>
            {assignmentNames.map((assignment, index) => (
              <td key={index}>
                {calculateRange(assignment)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default App;
