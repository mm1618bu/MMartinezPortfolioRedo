const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftName: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: 'available' },
  assignedTo: { type: String, default: '' },
});

module.exports = mongoose.model('Shift', shiftSchema);
