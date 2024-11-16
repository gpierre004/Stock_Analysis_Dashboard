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

// Helper function to handle database errors
const handleDatabaseError = (error, res) => {
  console.error('Database Error:', error);
  res.status(500).json({
    error: 'Database error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

app.get('/api/prices/latest', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON ("CompanyTicker") 
        "CompanyTicker",
        date,
        "adjustedClose"::numeric::float8 as "adjustedClose",
        volume::numeric::float8 as volume
      FROM public."StockPrices"
      WHERE "adjustedClose" IS NOT NULL
      ORDER BY "CompanyTicker", date DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/analysis/volume/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await pool.query(`
      WITH RecentPrices AS (
        SELECT 
          "CompanyTicker",
          date,
          volume::numeric::float8 as volume,
          "adjustedClose"::numeric::float8 as "adjustedClose",
          AVG(volume::numeric::float8) OVER (
            ORDER BY date 
            ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
          ) as avg_volume
        FROM public."StockPrices"
        WHERE "CompanyTicker" = $1
          AND volume IS NOT NULL
          AND "adjustedClose" IS NOT NULL
        ORDER BY date DESC
        LIMIT 21
      )
      SELECT 
        "CompanyTicker",
        FIRST_VALUE(volume) OVER (ORDER BY date DESC) as volume,
        FIRST_VALUE(avg_volume) OVER (ORDER BY date DESC) as avg_volume,
        SUM(volume * "adjustedClose") / NULLIF(SUM(volume), 0) as vwap
      FROM RecentPrices
      GROUP BY "CompanyTicker", date
      ORDER BY date DESC
      LIMIT 1
    `, [ticker]);
    res.json(rows[0] || null);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/analysis/technical/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { rows } = await pool.query(`
      WITH RecentPrices AS (
        SELECT 
          "CompanyTicker",
          date,
          "adjustedClose"::numeric::float8 as "adjustedClose",
          volume::numeric::float8 as volume,
          LAG("adjustedClose"::numeric::float8, 20) OVER (ORDER BY date) as price_20d_ago
        FROM public."StockPrices"
        WHERE "CompanyTicker" = $1
          AND "adjustedClose" IS NOT NULL
          AND volume IS NOT NULL
        ORDER BY date DESC
        LIMIT 20
      )
      SELECT 
        "CompanyTicker",
        FIRST_VALUE("adjustedClose") OVER w as current_price,
        CASE 
          WHEN price_20d_ago IS NOT NULL THEN
            ROUND(
              ("adjustedClose" - price_20d_ago) / NULLIF(price_20d_ago, 0) * 100,
              2
            )
          ELSE NULL
        END as price_change_20d,
        AVG("adjustedClose") OVER w as sma20,
        AVG(volume) OVER w as avg_volume
      FROM RecentPrices
      WINDOW w AS (ORDER BY date DESC)
      ORDER BY date DESC
      LIMIT 1
    `, [ticker]);
    res.json(rows[0] || null);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/analysis/correlations', async (req, res) => {
  try {
    const { tickers } = req.query;
    if (!tickers) {
      return res.status(400).json({ error: 'Tickers parameter is required' });
    }
    
    const tickerArray = tickers.split(',');
    const { rows } = await pool.query(`
      WITH DailyReturns AS (
        SELECT 
          "CompanyTicker",
          date,
          ("adjustedClose"::numeric::float8 - LAG("adjustedClose"::numeric::float8) OVER (PARTITION BY "CompanyTicker" ORDER BY date)) 
          / NULLIF(LAG("adjustedClose"::numeric::float8) OVER (PARTITION BY "CompanyTicker" ORDER BY date), 0) as daily_return
        FROM public."StockPrices"
        WHERE "CompanyTicker" = ANY($1)
          AND "adjustedClose" IS NOT NULL
          AND date >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        a."CompanyTicker" as ticker1,
        b."CompanyTicker" as ticker2,
        CORR(a.daily_return, b.daily_return)::numeric::float8 as correlation
      FROM DailyReturns a
      JOIN DailyReturns b ON a.date = b.date AND a."CompanyTicker" < b."CompanyTicker"
      GROUP BY a."CompanyTicker", b."CompanyTicker"
      HAVING COUNT(*) >= 24
    `, [tickerArray]);
    res.json(rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});