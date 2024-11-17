import express from 'express';
import stockPriceRoutes from '.';
import transactionRoutes from './transactionRoutes.js';


const router = express.Router();

// Mount the routes
router.use('/stock-prices', stockPriceRoutes);
router.use('/transactions', transactionRoutes);

  
export default router;