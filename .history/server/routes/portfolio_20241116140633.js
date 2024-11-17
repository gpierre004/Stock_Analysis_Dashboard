   // server/routes/portfolio.js
   import express from 'express';
   import { query } from '../database/db.js';

   const router = express.Router();

   // Get portfolio data
   // Get portfolio data from the vw_profit_loss view
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM public.vw_profit_loss'); // Query the view
    res.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

export default router;