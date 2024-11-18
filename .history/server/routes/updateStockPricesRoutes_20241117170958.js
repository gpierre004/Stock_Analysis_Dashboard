import dotenv from 'dotenv';
import express from 'express';
import { updateStockPrices, getTickers, getStockData } from '../services/priceUpdater.js';

const router = express.Router();

// Route to trigger the stock data update process
router.post('/stock-prices/update', async (req, res) => {
    try {
        const tickers = await getTickers();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);

        let updatedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const ticker of tickers) {
            try {
                console.log(`Processing ${ticker}...`);
                const stockData = await getStockData(ticker, startDate, endDate);
                
                if (stockData) {
                    await updateStockPrices(ticker, stockData);
                    updatedCount++;
                    console.log(`Updated stock prices for ${ticker}`);
                } else {
                    errorCount++;
                    errors.push(`No data available for ${ticker}`);
                    console.log(`Skipping ${ticker} due to data fetch issues.`);
                }
            } catch (error) {
                errorCount++;
                errors.push(`Error processing ${ticker}: ${error.message}`);
                console.error(`Error processing ${ticker}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Updated ${updatedCount} stocks successfully. ${errorCount} stocks had errors.`,
            details: {
                updatedCount,
                errorCount,
                errors
            }
        });
    } catch (error) {
        console.error('Error updating stock prices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stock prices',
            error: error.message
        });
    }
});

export default router;
