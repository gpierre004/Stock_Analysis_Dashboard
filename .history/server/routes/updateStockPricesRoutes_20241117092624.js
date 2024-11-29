import dotenv from 'dotenv';
import express from 'express';
import { updatestock_prices } from '../services/priceUpdater.js';

const router = express.Router();
// Route to trigger the stock data update process
router.get('/stock-prices', async (req, res) => {
    try {
      await updatestock_prices();
      res.send('Stock prices updated successfully');
    } catch (error) {
      console.error('Error updating stock prices:', error);
      res.status(500).send('An error occurred while updating stock prices');
    }
  });
  const port = process.env.PORT || 3000;
  // Start the server
  router.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  export default router;