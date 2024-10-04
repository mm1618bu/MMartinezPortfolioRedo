const express = require('express');
const connectDB = require('./db.js');
const scheduleRoutes = require('./routes/scheduleRoutes'); // Adjust the path as necessary
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

connectDB();

app.use('/api/schedules', scheduleRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});