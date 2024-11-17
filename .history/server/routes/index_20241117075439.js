import express from 'express';
import companyRoutes from './companyRoutes.js';
import portfolioRoutes from './portfolioRoutes.js';
import stockPriceRoutes from './stockPriceRoutes.js';
import watchListRoutes from './watchListRoutes.js';
import userRoutes from './userRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import path from 'path';

//import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Mount the routes
router.use('/stock-prices', stockPriceRoutes);
router.use('/companies', companyRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/watch-list', watchListRoutes);
router.use('/users', userRoutes);
router.use('/analysis', analysisRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/transactions', transactionRoutes);

router.get('/top-performers', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/top_performers.html'));
  });
  
export default router;