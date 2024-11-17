import express from 'express';
import { updateStockPrices } from '../services/priceUpdater.js';

const router = express.Router();
// Route to trigger the stock data update process
app.get('/ustock-prices', async (req, res) => {
    try {
      await updateStockPrices();
      res.send('Stock prices updated successfully');
    } catch (error) {
      console.error('Error updating stock prices:', error);
      res.status(500).send('An error occurred while updating stock prices');
    }
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  export default router;