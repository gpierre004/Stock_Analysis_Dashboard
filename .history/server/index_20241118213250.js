import express from 'express';
import cors from 'cors';
import { sequelize } from './database/db.js';
import logger from './utils/logger.js';

// Import routes
import portfolioRoutes from './routes/portfolio.js';
import stockPricesRoutes from './routes/stockPrices.js';
import watchlistRoutes from './routes/watchlist.js';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import updateStockPricesRoutes from './routes/updateStockPricesRoutes.js';

// Import scheduled tasks
import { scheduleWatchlistPriceUpdates } from './services/scheduledTasks.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stock-prices', stockPricesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/update-stock-prices', updateStockPricesRoutes);

// Database connection
try {
  await sequelize.authenticate();
  logger.info('Database connection established successfully.');
  
  // Sync models (optional, be cautious in production)
  await sequelize.sync({ alter: true });
  logger.info('Database models synchronized.');
} catch (error) {
  logger.error('Unable to connect to the database:', error);
}

// Initialize scheduled tasks
scheduleWatchlistPriceUpdates();

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
