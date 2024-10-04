const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule'); // Adjust the path as necessary

// Get all schedules
router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find().lean().exec();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;