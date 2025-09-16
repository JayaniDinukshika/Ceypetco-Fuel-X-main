const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const User = require('../models/User');
const Employee = require('../models/Employee');

router.post('/', async (req, res) => {
  try {
    const { username, password, employeeId, employeeName, jobRole } = req.body;

    // 1. Save to Staff collection
    const newStaff = new Staff({
      username,
      password,
      employeeId,
      employeeName,
      jobRole
    });
    const savedStaff = await newStaff.save();

    // 2. Save to Users collection
    const newUser = new User({
      username,
      password,
      employeeId,
      employeeName,
      jobRole
    });
    const savedUser = await newUser.save(); // Save and capture the user ID

    // 3. Save to Employees collection with userId reference
    const newEmployee = new Employee({
      userId: savedUser._id, // link to the user document
      employeeId,
      employeeName,
      jobRole
    });
    const savedEmployee = await newEmployee.save();

    res.status(201).json({
      staff: savedStaff,
      user: savedUser,
      employee: savedEmployee
    });
  } catch (err) {
    console.error('Error saving staff/user/employee:', err.message);
    res.status(500).json({ message: 'Error saving staff, user, and employee data' });
  }
});

module.exports = router;
