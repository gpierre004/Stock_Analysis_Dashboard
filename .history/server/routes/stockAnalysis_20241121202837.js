import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

// Get latest prices for top 5 stocks
router.get('/prices/latest', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM vw_latest_prices LIMIT 5'
    );
    res.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// Get volume analysis for a specific ticker
router.get('/analysis/volume/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await query(
      'SELECT * FROM vw_volume_analysis WHERE "ticker" = $1',
      [ticker]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// Get technical analysis for a specific ticker
router.get('/analysis/technical/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await query(
      'SELECT * FROM vw_technical_analysis WHERE "ticker" = $1',
      [ticker]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// Get correlations between multiple tickers
router.get('/analysis/correlations', async (req, res) => {
  try {
    const { tickers } = req.query;
    if (!tickers) {
      return res.status(400).json({ error: 'Tickers parameter is required' });
    }
    
    const tickerArray = tickers.split(',');
    const { rows } = await query(`
      WITH DailyReturns AS (
        SELECT 
          "ticker",
          date,
          ("adjustedClose"::numeric::float8 - LAG("adjustedClose"::numeric::float8) OVER (PARTITION BY "ticker" ORDER BY date)) 
          / NULLIF(LAG("adjustedClose"::numeric::float8) OVER (PARTITION BY "ticker" ORDER BY date), 0) as daily_return
        FROM public."StockPrices"
        WHERE "ticker" = ANY($1)
          AND "adjustedClose" IS NOT NULL
          AND date >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        a."ticker" as ticker1,
        b."ticker" as ticker2,
        CORR(a.daily_return, b.daily_return)::numeric::float8 as correlation
      FROM DailyReturns a
      JOIN DailyReturns b ON a.date = b.date AND a."ticker" < b."ticker"
      GROUP BY a."ticker", b."ticker"
      HAVING COUNT(*) >= 24
    `, [tickerArray]);
    res.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

export default router;