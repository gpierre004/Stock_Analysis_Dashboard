import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

app.use(cors());
app.use(express.json());

app.get('/api/prices/latest', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH LatestPrices AS (
        SELECT DISTINCT ON ("ticker") *
        FROM public."StockPrices"
        ORDER BY "ticker", date DESC
      )
      SELECT * FROM LatestPrices
      LIMIT 5
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/volume/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await pool.query(`
      WITH VolumeStats AS (
        SELECT 
          "ticker",
          volume,
          AVG(volume) OVER (ORDER BY date ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING) as avg_volume,
          SUM(volume * "adjustedClose") / SUM(volume) as vwap
        FROM public."StockPrices"
        WHERE "ticker" = $1
        ORDER BY date DESC
        LIMIT 1
      )
      SELECT * FROM VolumeStats
    `, [ticker]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/technical/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await pool.query(`
      WITH TechnicalData AS (
        SELECT 
          "ticker",
          "adjustedClose",
          LAG("adjustedClose", 20) OVER (ORDER BY date) as price_20d_ago,
          volume,
          date
        FROM public."StockPrices"
        WHERE "ticker" = \$1
        ORDER BY date DESC
        LIMIT 20
      )
      SELECT 
        "ticker",
        "adjustedClose" as current_price,
        ROUND(("adjustedClose" - price_20d_ago) / price_20d_ago * 100, 2.0) as price_change_20d,  -- Use 2.0 instead of 2
        AVG("adjustedClose") as sma20,
        AVG(volume) as avg_volume
      FROM TechnicalData
      GROUP BY "ticker", "adjustedClose", price_20d_ago
    `, [ticker]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/correlations', async (req, res) => {
  try {
    const { tickers } = req.query;
    const tickerArray = tickers.split(',');
    const { rows } = await pool.query(`
      WITH DailyReturns AS (
        SELECT 
          "ticker",
          date,
          ("adjustedClose" - LAG("adjustedClose") OVER (PARTITION BY "ticker" ORDER BY date)) 
          / LAG("adjustedClose") OVER (PARTITION BY "ticker" ORDER BY date) as daily_return
        FROM public."StockPrices"
        WHERE "ticker" = ANY($1)
        AND date >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        a."ticker" as ticker1,
        b."ticker" as ticker2,
        CORR(a.daily_return, b.daily_return) as correlation
      FROM DailyReturns a
      JOIN DailyReturns b ON a.date = b.date AND a."ticker" < b."ticker"
      GROUP BY a."ticker", b."ticker"
      HAVING COUNT(*) >= 24
    `, [tickerArray]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});