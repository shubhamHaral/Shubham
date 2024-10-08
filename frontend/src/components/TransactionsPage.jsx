import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TransactionsPage.css'; // Create this CSS file for styling

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [barChartData, setBarChartData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(3); // Default to March
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    // Define month options
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const transactionsResponse = await axios.get(`/api/transactions?month=${selectedMonth}&page=${currentPage}&search=${searchText}`);
                const statisticsResponse = await axios.get(`/api/statistics?month=${selectedMonth}`);
                const barChartResponse = await axios.get(`/api/bar-chart?month=${selectedMonth}`);

                setTransactions(transactionsResponse.data.transactions);
                setStatistics(statisticsResponse.data);
                setBarChartData(barChartResponse.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMonth, searchText, currentPage]);

    const handleMonthChange = (event) => {
        setSelectedMonth(parseInt(event.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const handleSearchChange = (event) => {
        setSearchText(event.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleNextPage = () => {
        setCurrentPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    // Filter transactions based on search input
    const filteredTransactions = transactions.filter((transaction) =>
        transaction.title.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.price.toString().includes(searchText)
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Transactions</h1>
            <label htmlFor="month-select">Select Month: </label>
            <select id="month-select" value={selectedMonth} onChange={handleMonthChange}>
                {months.map(month => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>

            <input
                type="text"
                placeholder="Search transactions..."
                value={searchText}
                onChange={handleSearchChange}
            />

            <h2>Transactions Table</h2>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(transaction => (
                            <tr key={transaction.id}>
                                <td>{transaction.title}</td>
                                <td>{transaction.description}</td>
                                <td>{transaction.price}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">No transactions found for this search.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div>
                <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
                <button onClick={handleNextPage}>Next</button>
            </div>

            <h2>Transaction Statistics</h2>
            <div className="stats">
                <p>Total Amount of Sale: {statistics.totalSalesAmount}</p>
                <p>Total Sold Items: {statistics.totalSoldItems}</p>
                <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
            </div>

            <div className="chart-container">
                <h2>Transactions Bar Chart</h2>
                <div className="bar-chart">
                    {barChartData.map(item => (
                        <div className="bar" key={item.range} style={{ height: `${item.count * 10}px` }}>
                            <span className="bar-label">{item.range}</span>
                            <span className="bar-value">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TransactionsPage;
