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
app.use('/stock-prices', updateStockPriceRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});