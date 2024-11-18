import express from 'express';
import { getWatchList, updateWatchListPrices, updateWatchListPriceChange, cleanupWatchList } from '../services/watchlistService.js';

const router = express.Router();

// Get watchlist items
router.get('/', async (req, res) => {
    try {
        // TODO: Replace with actual user ID from auth
        const userId = 1;
        const watchlist = await getWatchList(userId);
        res.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// Update watchlist prices
router.post('/update-prices', async (req, res) => {
    try {
        const result = await updateWatchListPrices();
        await updateWatchListPriceChange();
        res.json(result);
    } catch (error) {
        console.error('Error updating watchlist prices:', error);
        res.status(500).json({ error: 'Failed to update watchlist prices' });
    }
});

// Cleanup old watchlist items
router.post('/cleanup', async (req, res) => {
    try {
        const result = await cleanupWatchList();
        res.json(result);
    } catch (error) {
        console.error('Error cleaning up watchlist:', error);
        res.status(500).json({ error: 'Failed to cleanup watchlist' });
    }
});

export default router;
