import express from 'express';
import { getStockPrices, getUpdateStatus } from '../services/stockPriceService.js';
import { updateAllStockPrices } from '../services/dataUpdate.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

const router = express.Router();

const { Pool } = pg;
yahooFinance.suppressNotices(['ripHistorical']);

// Fetch tickers from the database
async function getTickers() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT ticker FROM public."Companies"');
    return result.rows.map(row => row.ticker);
  } finally {
    client.release();
  }
}

// Fetch stock data from Yahoo Finance
async function getStockData(ticker, startDate, endDate) {
  try {
    const queryOptions = {
      period1: Math.floor(startDate.getTime() / 1000),
      period2: Math.floor(endDate.getTime() / 1000),
      interval: '1d',
    };

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await yahooFinance.historical(ticker, queryOptions);
        return result;
      } catch (error) {
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

// Update stock prices in the database
async function updateStockPrices(ticker, stockData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    await client.query(
      'DELETE FROM public."StockPrices" WHERE "ticker" = $1 AND date < $2',
      [ticker, threeYearsAgo]
    );

    for (const data of stockData) {
      await client.query(
        `INSERT INTO public."StockPrices"(
            date, open, high, low, close, volume, "adjustedClose", "ticker", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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

// Main function to process tickers and update stock prices
async function processTickers() {
  const tickers = await getTickers();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);

  for (const ticker of tickers) {
    console.log(`Processing ${ticker}...`);
    const stockData = await getStockData(ticker, startDate, endDate);
    if (stockData) {
      await updateStockPrices(ticker, stockData);
      console.log(`Updated stock prices for ${ticker}`);
    } else {
      console.log(`Skipping ${ticker} due to data fetch issues.`);
    }
  }
}