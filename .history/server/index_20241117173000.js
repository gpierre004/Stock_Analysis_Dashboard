import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import portfolioRoutes from './routes/portfolio.js';
import updateStockPriceRoutes from './routes/updateStockPricesRoutes.js';
import watchlistRoutes from './routes/watchlist.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', stockAnalysisRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api', updateStockPriceRoutes);
app.use('/api/watchlist', watchlistRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
