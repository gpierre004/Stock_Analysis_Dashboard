import { Router } from 'express';
import { 
  getWatchList, 
  updateWatchListPrices, 
  cleanupWatchList,
  refreshWatchList 
} from '../services/watchlistService.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const watchList = await getWatchList();
    res.json(watchList);
  } catch (error) {
    logger.error(`Error fetching watchlist: ${error.message}`);
    res.status(500).json({ error: 'Error fetching watchlist' });
  }
});

router.put('/update-prices', async (req, res) => {
  try {
    const result = await updateWatchListPrices();
    res.json(result);
  } catch (error) {
    logger.error(`Error updating watch list prices: ${error.message}`);
    res.status(500).json({ error: 'Error updating watch list prices' });
  }
});

router.delete('/cleanup', async (req, res) => {
  try {
    const result = await cleanupWatchList();
    res.json(result);
  } catch (error) {
    logger.error(`Error cleaning up watch list: ${error.message}`);
    res.status(500).json({ error: 'Error cleaning up watch list' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshWatchList();
    res.json(result);
  } catch (error) {
    logger.error(`Error refreshing watch list: ${error.message}`);
    res.status(500).json({ error: 'Error refreshing watch list' });
  }
});

export default router;
