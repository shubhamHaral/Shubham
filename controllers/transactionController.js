const axios = require('axios');
const Transaction = require('../models/Transaction');

// Initialize the database with seed data
exports.initializeDatabase = async (req, res) => {
    try {
        // Fetch data from third-party API
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Clear existing data and insert the new data
        await Transaction.deleteMany({});
        await Transaction.insertMany(
            transactions.map(transaction => ({
                id: transaction.id,
                title: transaction.title,
                price: transaction.price,
                description: transaction.description,
                category: transaction.category,
                image: transaction.image,
                sold: transaction.sold,
                dateOfSale: new Date(transaction.dateOfSale),
            }))
        );

        res.status(200).json({ message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Error initializing database:', error.message);
        res.status(500).json({ error: 'Server error while initializing database.' });
    }
};

// List all transactions with search and pagination
exports.getAllTransactions = async (req, res) => {
    try {
        // Get query parameters
        const { search = '', page = 1, perPage = 10 } = req.query;
        const pageNumber = parseInt(page);
        const perPageNumber = parseInt(perPage);

        // Log the received query parameters for debugging
        console.log('Received query parameters:', req.query);

        // Define search criteria based on search parameter
        const searchCriteria = search
            ? {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { price: { $regex: search, $options: 'i' } },
                ],
            }
            : {};

        // Count total documents for pagination
        const totalDocuments = await Transaction.countDocuments(searchCriteria);

        // Fetch transactions based on search criteria and pagination
        const transactions = await Transaction.find(searchCriteria)
            .skip((pageNumber - 1) * perPageNumber)
            .limit(perPageNumber);

        res.status(200).json({
            page: pageNumber,
            perPage: perPageNumber,
            totalDocuments,
            transactions,
        });
    } catch (error) {
        console.error('Error occurred while fetching transactions:', error.message);
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
};

// Get statistics for the selected month
exports.getStatistics = async (req, res) => {
    try {
        const { month } = req.query;

        // Validate that the month is provided and is a number between 1 and 12
        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid or missing month parameter. Please provide a value between 1 and 12.' });
        }

        const monthNumber = parseInt(month);
        const startDate = new Date(2021, monthNumber - 1, 1);
        const endDate = new Date(2021, monthNumber, 0);

        // Aggregate total sales and sold items for the given month
        const totalSales = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lte: endDate }, sold: true } },
            { $group: { _id: null, totalSales: { $sum: '$price' }, soldItems: { $sum: 1 } } },
        ]);

        const notSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startDate, $lte: endDate },
            sold: false,
        });

        res.status(200).json({
            totalSalesAmount: totalSales[0]?.totalSales || 0,
            totalSoldItems: totalSales[0]?.soldItems || 0,
            totalNotSoldItems: notSoldItems,
        });
    } catch (error) {
        console.error('Error occurred while fetching statistics:', error.message);
        res.status(500).json({ error: 'Server error while fetching statistics' });
    }
};

// Get bar chart data for the selected month
exports.getBarChart = async (req, res) => {
    try {
        const { month } = req.query;

        // Validate that the month parameter is provided and is a number between 1 and 12
        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid or missing month parameter. Please provide a value between 1 and 12.' });
        }

        const monthNumber = parseInt(month);
        const startDate = new Date(2021, monthNumber - 1, 1);
        const endDate = new Date(2021, monthNumber, 0);

        // Define the price ranges for the bar chart
        const priceRanges = [
            { range: '0-100', min: 0, max: 100 },
            { range: '101-200', min: 101, max: 200 },
            { range: '201-300', min: 201, max: 300 },
            { range: '301-400', min: 301, max: 400 },
            { range: '401-500', min: 401, max: 500 },
            { range: '501-600', min: 501, max: 600 },
            { range: '601-700', min: 601, max: 700 },
            { range: '701-800', min: 701, max: 800 },
            { range: '801-900', min: 801, max: 900 },
            { range: '901-above', min: 901, max: Infinity },
        ];

        const result = await Promise.all(
            priceRanges.map(async (range) => {
                const count = await Transaction.countDocuments({
                    dateOfSale: { $gte: startDate, $lte: endDate },
                    price: { $gte: range.min, $lte: range.max },
                });
                return { range: range.range, count };
            })
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error occurred while fetching bar chart:', error.message);
        res.status(500).json({ error: 'Server error while fetching bar chart data.' });
    }
};

// Get pie chart data for the selected month
exports.getPieChart = async (req, res) => {
    try {
        const { month } = req.query;

        // Validate the month parameter
        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid or missing month parameter. Please provide a value between 1 and 12.' });
        }

        const startDate = new Date(`2021-${month}-01`);
        const endDate = new Date(`2021-${month}-31`);

        const result = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error occurred while fetching pie chart data:', error.message);
        res.status(500).json({ error: 'Server error while fetching pie chart data.' });
    }
};

// Get combined data from all APIs
exports.getCombinedData = async (req, res) => {
    try {
        const { month } = req.query;

        // Validate that the month parameter is provided and is a number between 1 and 12
        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid or missing month parameter. Please provide a value between 1 and 12.' });
        }

        // Get combined data from all APIs without passing req and res
        const [transactions, statistics, barChart, pieChart] = await Promise.all([
            exports.getAllTransactionsData(month),
            exports.getStatistics(month),
            exports.getBarChart(month),
            exports.getPieChart(month),
        ]);

        res.status(200).json({ transactions, statistics, barChart, pieChart });
    } catch (error) {
        console.error('Error occurred while fetching combined data:', error.message);
        res.status(500).json({ error: 'Server error while fetching combined data.' });
    }
};

// Fetch all transactions for the selected month
exports.getAllTransactionsData = async (month) => {
    const startDate = new Date(2021, month - 1, 1); // Start of the month
    const endDate = new Date(2021, month, 0); // Last day of the month

    return await Transaction.find({
        dateOfSale: { $gte: startDate, $lte: endDate }
    });
};
