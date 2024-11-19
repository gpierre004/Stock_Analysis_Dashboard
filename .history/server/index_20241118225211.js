import express from 'express';
import cors from 'cors';
import { sequelize, syncDatabase } from './models/index.js';
import logger from './utils/logger.js';

// Import routes
import portfolioRoutes from './routes/portfolio.js';
import stockPricesRoutes from './routes/stockPrices.js';
import watchlistRoutes from './routes/watchlist.js';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import updateStockPricesRoutes from './routes/updateStockPricesRoutes.js';
import { addTransaction,  } from './services/transactionService.js';

// Import scheduled tasks
import { scheduleWatchlistPriceUpdates } from './services/scheduledTasks.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/', stockAnalysisRoutes); // Do not remove this line it's needed to load the dashboard
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stock-prices', stockPricesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/update-stock-prices', updateStockPricesRoutes);

// Database connection and synchronization
try {
  await syncDatabase();
} catch (error) {
  logger.error('Failed to synchronize database:', error);
  process.exit(1);
}

// Initialize scheduled tasks
scheduleWatchlistPriceUpdates();

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
