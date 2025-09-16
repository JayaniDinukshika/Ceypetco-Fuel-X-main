const express = require('express');
const router = express.Router();
const BrowserDetails = require('../models/browserDetailsModel');

// POST route to save multiple browser details
router.post('/', async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body]; // Ensure data is an array

    // Basic validation for required fields
    for (const item of data) {
      if (!item.date || !item.invoiceNo || !item.browserNo || !item.product || !item.quantity || !item.sealNo) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number' });
      }
    }

    const browserDetails = await BrowserDetails.insertMany(data, { runValidators: true });
    res.status(201).json({ message: 'Browser details saved successfully', data: browserDetails });
  } catch (error) {
    console.error('Error saving browser details:', error); // Log error for debugging
    res.status(400).json({ message: 'Error saving browser details', error: error.message });
  }
});

// GET route to fetch all browser details with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and 10 items per page
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ message: 'Page and limit must be positive integers' });
    }

    const details = await BrowserDetails.find()
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await BrowserDetails.countDocuments();

    res.status(200).json({
      message: 'Browser details fetched successfully',
      data: details,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching browser details:', error); // Log error for debugging
    res.status(500).json({ message: 'Error fetching browser details', error: error.message });
  }
});

module.exports = router;