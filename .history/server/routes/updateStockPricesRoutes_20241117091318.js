import express from 'express';
//import { processTickers } from '../services/pri.js';

const router = express.Router();
// Route to trigger the stock data update process
app.get('/update-stock-prices', async (req, res) => {
    try {
      ///await processTickers();
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