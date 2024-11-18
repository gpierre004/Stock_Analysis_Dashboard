import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { syncDatabase } from './models/index.js';
import logger from './utils/logger.js';

// Routes imports
import watchlistRoutes from './routes/watchlist.js';
import portfolioRoutes from './routes/portfolio.js';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import updateStockPricesRoutes from './routes/updateStockPricesRoutes.js';
import stockPricesRoutes from './routes/stockPrices.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', stockAnalysisRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/update-prices', updateStockPricesRoutes);
app.use('/api/prices', stockPricesRoutes);
app.use('/api/analysis', stockPricesRoutes);

// Debugging route to check server status
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Start server with database sync
async function startServer() {
  try {
    // Synchronize database models
    await syncDatabase();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Available routes:');
      logger.info('- /api');
      logger.info('- /api/watchlist');
      logger.info('- /api/portfolio');
      logger.info('- /api/stock-analysis');
      logger.info('- /api/update-prices');
      logger.info('- /api/prices');
      logger.info('- /api/analysis');
      logger.info('- /api/health');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;
