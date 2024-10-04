import React, { useState, useEffect } from 'react';
import { getShifts, assignShift } from '../services/api';

const ShiftList = () => {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await getShifts();
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleAssign = async (shiftId) => {
    const employeeName = prompt('Enter your name to assign the shift');
    if (employeeName) {
      try {
        await assignShift(shiftId, employeeName);
        fetchShifts(); // Refresh the shift list
      } catch (error) {
        console.error('Error assigning shift:', error);
      }
    }
  };

  return (
    <div>
      <h2>Available Shifts</h2>
      <ul>
        {shifts.map(shift => (
          <li key={shift._id}>
            {shift.shiftName} ({shift.startTime} - {shift.endTime}) - {shift.status}
            {shift.status === 'available' && (
              <button onClick={() => handleAssign(shift._id)}>Take Shift</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShiftList;
