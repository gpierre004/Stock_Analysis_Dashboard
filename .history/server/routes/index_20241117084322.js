import express from 'express';
import stockPriceRoutes from './updateStockPricesRoutes.js';
import transactionRoutes from './transactionRoutes.js';


const router = express.Router();

// Mount the routes
router.use('/ustock-prices', stockPriceRoutes);
router.use('/transactions', transactionRoutes);

  
export default router;