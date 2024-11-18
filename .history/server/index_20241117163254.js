import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import portfolioRoutes from './routes/portfolio.js'; // Import the portfolio routes
import updateStockPriceRoutes from './routes/updateStockPricesRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', stockAnalysisRoutes);
app.use('/api/portfolio', portfolioRoutes); // Use the portfolio routes
//app.use('/stock-prices', updateStockPriceRoutes);

app.post('/api/stock-prices/update', async (req, res) => {
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
      console.error('An error occurred:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to update stock prices',
          error: error.message
      });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});