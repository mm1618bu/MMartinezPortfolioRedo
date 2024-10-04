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
