const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const staffRoutes = require('./routes/staffRoutes');
const browserDetailsRoutes = require('./routes/browserDetailsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add root route to handle GET /
app.get('/', (req, res) => {
  res.send('Welcome to the Staff Management and Fuel Management API');
});

// Routes
app.use('/api/staff', staffRoutes);
app.use('/api/browser-details', browserDetailsRoutes);
// server.js
app.use('/api/users', require('./routes/userRoutes'));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});