import express from 'express';
import stockPriceRoutes from './updateStockPricesRoutes.js';
import transactionRoutes from './transactionRoutes.js';

//import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Mount the routes
router.use('/stock-prices', stockPriceRoutes);
router.use('/transactions', transactionRoutes);

  
export default router;