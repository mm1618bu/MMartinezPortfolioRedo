const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shiftRoutes = require('./routes/shifts');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://admin1:admin1@packagehandling.vabfw.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// API routes
app.use('/api/shifts', shiftRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
