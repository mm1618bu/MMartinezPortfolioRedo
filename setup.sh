#!/bin/bash

# Step 1: Create React app and install dependencies
echo "Creating React app..."
npx create-react-app employee-shift-picker

cd employee-shift-picker

# Step 2: Create server directory
echo "Setting up backend (server)..."
mkdir server
cd server

# Step 3: Create folders for backend
mkdir models routes config

# Step 4: Initialize Node.js project for Express
npm init -y

# Step 5: Install backend dependencies
npm install express mongoose cors

# Step 6: Create index.js for Express server
echo "Creating server/index.js..."
cat <<EOL > index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shiftRoutes = require('./routes/shifts');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/shiftScheduler', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// API routes
app.use('/api/shifts', shiftRoutes);

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
EOL

# Step 7: Create Shift model (server/models/Shift.js)
echo "Creating server/models/Shift.js..."
cat <<EOL > models/Shift.js
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftName: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: 'available' },
  assignedTo: { type: String, default: '' },
});

module.exports = mongoose.model('Shift', shiftSchema);
EOL

# Step 8: Create Shift routes (server/routes/shifts.js)
echo "Creating server/routes/shifts.js..."
cat <<EOL > routes/shifts.js
const express = require('express');
const Shift = require('../models/Shift');

const router = express.Router();

// Get all shifts
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new shift
router.post('/', async (req, res) => {
  const { shiftName, startTime, endTime } = req.body;
  try {
    const newShift = new Shift({ shiftName, startTime, endTime });
    await newShift.save();
    res.json(newShift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign shift to employee
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  
  try {
    const shift = await Shift.findByIdAndUpdate(
      id,
      { status: 'taken', assignedTo },
      { new: true }
    );
    res.json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
EOL

# Step 9: Set up the React frontend environment
echo "Setting up frontend (React)..."
cd ../
cd client

# Step 10: Install frontend dependencies
npm install axios

# Step 11: Create API service (client/src/services/api.js)
echo "Creating client/src/services/api.js..."
mkdir -p src/services
cat <<EOL > src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/shifts';

export const getShifts = () => axios.get(API_URL);
export const createShift = (shiftData) => axios.post(API_URL, shiftData);
export const assignShift = (shiftId, assignedTo) => axios.patch(\`\${API_URL}/\${shiftId}\`, { assignedTo });
EOL

# Step 12: Create ShiftList component (client/src/components/ShiftList.js)
echo "Creating client/src/components/ShiftList.js..."
mkdir -p src/components
cat <<EOL > src/components/ShiftList.js
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
EOL

# Step 13: Update App.js to include ShiftList component (client/src/App.js)
echo "Updating client/src/App.js..."
cat <<EOL > src/App.js
import React from 'react';
import ShiftList from './components/ShiftList';

function App() {
  return (
    <div className="App">
      <h1>Employee Shift Picker</h1>
      <ShiftList />
    </div>
  );
}

export default App;
EOL

# Step 14: Final instructions
echo "Setup complete!"
echo "Run 'cd server && node index.js' to start the backend server."
echo "Run 'cd client && npm start' to start the React frontend."

