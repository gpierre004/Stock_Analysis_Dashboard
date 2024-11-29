import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncDatabase } from './models/index.js';
import logger from './utils/logger.js';

// Routes imports
import watchlistRoutes from './routes/watchlist.js';
import portfolioRoutes from './routes/portfolio.js';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import updateStockPricesRoutes from './routes/updateStockPricesRoutes.js';
import stock_pricesRoutes from './routes/stock_prices.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, '..', 'dist');

app.use(express.static(buildPath));

// Routes
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/update-prices', updateStockPricesRoutes);
app.use('/api/prices', stock_pricesRoutes);
app.use('/api/analysis', stock_pricesRoutes);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

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
      logger.info('Build path:', buildPath);
      logger.info('Available routes:');
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
