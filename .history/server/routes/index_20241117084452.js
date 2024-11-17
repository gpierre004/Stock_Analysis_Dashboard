import express from 'express';
import stockPriceRoutes from './routes/updateStockPricesRoutes.js';
import transactionRoutes from './transactionRoutes.js';


const router = express.Router();

// Mount the routes
router.use('/update-stock-prices', stockPriceRoutes);
router.use('/transactions', transactionRoutes);

  
export default router;