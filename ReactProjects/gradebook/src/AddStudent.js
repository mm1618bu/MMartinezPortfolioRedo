import React, { useState } from 'react';

const AddStudent = ({ onAddStudent }) => {
  const [studentName, setStudentName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (studentName.trim() === '') {
      alert('Please enter a valid student name');
      return;
    }

    // Add the student with blank/default grades
    const newStudent = {
      id: Date.now(),  // Unique ID based on timestamp
      name: studentName,
      grades: {
        attendance: '',
        week1: '',
        neoRealism: '',
        week2: '',
        week3: '',
        kurosawa: ''
      }
    };

    onAddStudent(newStudent);  // Callback to add student to the gradebook
    setStudentName('');  // Clear the input field
  };

  return (
    <form onSubmit={handleSubmit} className="add-student-form">
      <input
        type="text"
        placeholder="Enter student name"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
      />
      <button type="submit">Add Student</button>
    </form>
  );
};

export default AddStudent;
