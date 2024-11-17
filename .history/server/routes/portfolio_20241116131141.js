   // server/routes/portfolio.js
   import express from 'express';
   import { query } from '../database/db.js';

   const router = express.Router();

   // Get portfolio data
   router.get('/portfolio', async (req, res) => {
     try {
       const { rows } = await query(`
         SELECT 
           ticker,
           SUM(purchase_price * quantity) AS total_invested,
           SUM(current_price * quantity) AS current_value,
           (SUM(current_price * quantity) - SUM(purchase_price * quantity)) AS profit_loss
         FROM public.transactions
         GROUP BY ticker
       `);
       res.json(rows);
     } catch (error) {
       console.error('Database Error:', error);
       res.status(500).json({ error: 'Database error occurred' });
     }
   });

   export default router;