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
      SELECT DISTINCT ON ("ticker") 
        "ticker",
        date,
        "adjustedClose",
        volume
      FROM public."stock_prices"
      ORDER BY "ticker", date DESC
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
      WITH RecentPrices AS (
        SELECT 
          "ticker",
          date,
          volume,
          "adjustedClose",
          AVG(volume) OVER (
            ORDER BY date 
            ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
          ) as avg_volume
        FROM public."stock_prices"
        WHERE "ticker" = $1
        ORDER BY date DESC
        LIMIT 21
      )
      SELECT 
        "ticker",
        volume,
        avg_volume,
        SUM(volume * "adjustedClose") / NULLIF(SUM(volume), 0) as vwap
      FROM RecentPrices
      GROUP BY "ticker", volume, avg_volume
      LIMIT 1
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
      WITH RecentPrices AS (
        SELECT 
          "ticker",
          date,
          "adjustedClose",
          volume,
          LAG("adjustedClose", 20) OVER (ORDER BY date) as price_20d_ago
        FROM public."stock_prices"
        WHERE "ticker" = $1
        ORDER BY date DESC
        LIMIT 20
      )
      SELECT 
        "ticker",
        "adjustedClose" as current_price,
        ROUND(
          ("adjustedClose" - price_20d_ago) / NULLIF(price_20d_ago, 0) * 100, 
          2
        ) as price_change_20d,
        AVG("adjustedClose") OVER () as sma20,
        AVG(volume) OVER () as avg_volume
      FROM RecentPrices
      WHERE price_20d_ago IS NOT NULL
      LIMIT 1
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
          / NULLIF(LAG("adjustedClose") OVER (PARTITION BY "ticker" ORDER BY date), 0) as daily_return
        FROM public."stock_prices"
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