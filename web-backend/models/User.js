// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  employeeName: { type: String, required: true },
  jobRole: { type: String, required: true }
});

// This will map to the 'users' collection in MongoDB
module.exports = mongoose.model('User', userSchema);
