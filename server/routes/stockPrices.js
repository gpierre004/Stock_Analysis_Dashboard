import { Router } from 'express';
import { 
  getLatestStockPrices, 
  getVolumeAnalysis, 
  getTechnicalIndicators 
} from '../services/stockPriceService.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/latest', async (req, res) => {
  try {
    const latestPrices = await getLatestStockPrices();
    res.json(latestPrices);
  } catch (error) {
    logger.error(`Error fetching latest stock prices: ${error.message}`);
    res.status(500).json({ error: 'Unable to fetch latest stock prices' });
  }
});

router.get('/analysis/volume/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const volumeAnalysis = await getVolumeAnalysis(ticker);
    res.json(volumeAnalysis);
  } catch (error) {
    logger.error(`Error fetching volume analysis for ${req.params.ticker}: ${error.message}`);
    res.status(500).json({ error: 'Unable to fetch volume analysis' });
  }
});

router.get('/analysis/technical/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const technicalIndicators = await getTechnicalIndicators(ticker);
    res.json(technicalIndicators);
  } catch (error) {
    logger.error(`Error fetching technical indicators for ${req.params.ticker}: ${error.message}`);
    res.status(500).json({ error: 'Unable to fetch technical indicators' });
  }
});

export default router;
