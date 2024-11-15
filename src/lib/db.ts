import { Pool } from 'pg';

const pool = new Pool({
  user: 'your_username',
  host: 'your_host',
  database: 'sp500_analysis',
  password: 'your_password',
  port: 5432,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getLatestPrices(limit = 5) {
  const text = `
    WITH LatestPrices AS (
      SELECT DISTINCT ON ("CompanyTicker") *
      FROM public."StockPrices"
      ORDER BY "CompanyTicker", date DESC
    )
    SELECT * FROM LatestPrices
    LIMIT $1
  `;
  return query(text, [limit]);
}

export async function getVolumeAnalysis(ticker: string, days = 20) {
  const text = `
    WITH VolumeStats AS (
      SELECT 
        "CompanyTicker",
        volume,
        AVG(volume) OVER (ORDER BY date ROWS BETWEEN $1 PRECEDING AND 1 PRECEDING) as avg_volume,
        SUM(volume * "adjustedClose") / SUM(volume) as vwap
      FROM public."StockPrices"
      WHERE "CompanyTicker" = $2
      ORDER BY date DESC
      LIMIT 1
    )
    SELECT * FROM VolumeStats
  `;
  return query(text, [days, ticker]);
}

export async function getTechnicalIndicators(ticker: string) {
  const text = `
    WITH TechnicalData AS (
      SELECT 
        "CompanyTicker",
        "adjustedClose",
        LAG("adjustedClose", 20) OVER (ORDER BY date) as price_20d_ago,
        volume,
        date
      FROM public."StockPrices"
      WHERE "CompanyTicker" = $1
      ORDER BY date DESC
      LIMIT 20
    )
    SELECT 
      "CompanyTicker",
      "adjustedClose" as current_price,
      ROUND(("adjustedClose" - price_20d_ago) / price_20d_ago * 100, 2) as price_change_20d,
      AVG("adjustedClose") as sma20,
      AVG(volume) as avg_volume
    FROM TechnicalData
    GROUP BY "CompanyTicker", "adjustedClose", price_20d_ago
  `;
  return query(text, [ticker]);
}

export async function getCorrelations(tickers: string[], days = 30) {
  const text = `
    WITH DailyReturns AS (
      SELECT 
        "CompanyTicker",
        date,
        ("adjustedClose" - LAG("adjustedClose") OVER (PARTITION BY "CompanyTicker" ORDER BY date)) 
        / LAG("adjustedClose") OVER (PARTITION BY "CompanyTicker" ORDER BY date) as daily_return
      FROM public."StockPrices"
      WHERE "CompanyTicker" = ANY($1)
      AND date >= CURRENT_DATE - INTERVAL '$2 days'
    )
    SELECT 
      a."CompanyTicker" as ticker1,
      b."CompanyTicker" as ticker2,
      CORR(a.daily_return, b.daily_return) as correlation
    FROM DailyReturns a
    JOIN DailyReturns b ON a.date = b.date AND a."CompanyTicker" < b."CompanyTicker"
    GROUP BY a."CompanyTicker", b."CompanyTicker"
    HAVING COUNT(*) >= $2 * 0.8
  `;
  return query(text, [tickers, days]);
}