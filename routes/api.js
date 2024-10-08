const express = require('express');
const router = express.Router();
const {
    initializeDatabase,
    getAllTransactions,
    getStatistics,
    getBarChart,
    getPieChart,
    getCombinedData,
} = require('../controllers/transactionController');

// API to initialize the database
router.get('/initialize', initializeDatabase);

// API to list all transactions with search and pagination
router.get('/transactions', getAllTransactions);

// API for statistics of selected month
router.get('/statistics', getStatistics);

// API for bar chart data of selected month
router.get('/bar-chart', getBarChart);

// API for pie chart data of selected month
router.get('/pie-chart', getPieChart);

// API for combined data
router.get('/combined-data', getCombinedData);

module.exports = router;
