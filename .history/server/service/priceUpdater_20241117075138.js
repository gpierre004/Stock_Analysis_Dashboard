import pg from 'pg';
import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

const { Pool } = pg;

// Suppress the deprecation notice for `historical`
yahooFinance.suppressNotices(['ripHistorical']);

// PostgreSQL connection configuration
const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'sp500_analysis',
password: '1215',
port: 5432,
});

async function getTickers() {
const client = await pool.connect();
try {
    const result = await client.query('SELECT ticker FROM public."Companies"');
    return result.rows.map(row => row.ticker);
} finally {
    client.release();
}
}

async function getStockData(ticker, startDate, endDate) {
try {
    const queryOptions = {
    period1: Math.floor(startDate.getTime() / 1000),  // Convert date to UNIX timestamp
    period2: Math.floor(endDate.getTime() / 1000),
    interval: '1d',  // Daily data
    };

    let retries = 5;
    while (retries > 0) {
    try {
        const result = await yahooFinance.historical(ticker, queryOptions);
        return result;
    } catch (error) {
        // Handle 404 errors separately
        if (error.message.includes('HTTP 404 Not Found')) {
        console.error(`Data not found for ${ticker} (404). Skipping...`);
        return null;
        }

        if (retries === 1 || error.type !== 'invalid-json') {
        throw error;
        }

        retries -= 1;
        console.log(`Retrying for ${ticker}... Attempts left: ${retries}`);
        await new Promise(res => setTimeout(res, 3000)); // Wait 3 seconds before retrying
    }
    }
} catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return null;
}
}

async function updatestock_prices(ticker, stockData) {
const client = await pool.connect();
try {
    await client.query('BEGIN');

    // Remove old records (older than 3 years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 5);
    await client.query(
    'DELETE FROM public."stock_prices" WHERE "ticker" = $1 AND date < $2',
    [ticker, threeYearsAgo]
    );

    // Insert new records or update if they exist
    for (const data of stockData) {
        await client.query(
            `INSERT INTO public."stock_prices"(
              date, open, high, low, close, volume, "adjustedClose", "ticker", "createdAt", "updatedAt"
            ) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10)
            ON CONFLICT ("ticker", date) DO UPDATE SET
              open = EXCLUDED.open,
              high = EXCLUDED.high,
              low = EXCLUDED.low,
              close = EXCLUDED.close,
              volume = EXCLUDED.volume,
              "adjustedClose" = EXCLUDED."adjustedClose",
              "updatedAt" = EXCLUDED."updatedAt"`,
            [
              data.date,
              data.open,
              data.high,
              data.low,
              data.close,
              data.volume,
              data.adjClose,
              ticker,
              new Date(),
              new Date(),
            ]
          );
    }

    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating stock prices for ${ticker}:`, error);
} finally {
    client.release();
}
}

async function main() {
try {
    const tickers = await getTickers();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5);

    for (const ticker of tickers) {
    console.log(`Processing ${ticker}...`);
    const stockData = await getStockData(ticker, startDate, endDate);
    if (stockData) {
        await updatestock_prices(ticker, stockData);
        console.log(`Updated stock prices for ${ticker}`);
    } else {
        console.log(`Skipping ${ticker} due to data fetch issues.`);
    }
    }
} catch (error) {
    console.error('An error occurred:', error);
} finally {
    await pool.end();
}
}

main();
