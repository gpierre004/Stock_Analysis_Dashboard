import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
import yahooFinance from 'yahoo-finance2';
import { Company, StockPrice, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';
import pg from 'pg';
import { Op } from 'sequelize';

dotenv.config();

const { Pool } = pg;

// Suppress the deprecation notice for `historical`
yahooFinance.suppressNotices(['ripHistorical']);

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sp500_analysis',
  password: process.env.DB_PASSWORD || '1215',
  port: process.env.DB_PORT || 5432,
});

//Update the company list with 
export const refreshSP500List = async () => {
  try {
    const response = await axios.get('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies');
    const $ = cheerio.load(response.data);
    const companies = [];

    $('#constituents tbody tr').each((i, element) => {
      const $element = $(element);
      const ticker = $element.find('td:nth-child(1) a').text().trim();
      const name = $element.find('td:nth-child(2)').text().trim();
      const sector = $element.find('td:nth-child(3)').text().trim();
      const industry = $element.find('td:nth-child(4)').text().trim();
      const founded = $element.find('td:nth-child(9)').text().trim() || null;

      // Exclude tickers that contain a period or are blank
      if (ticker && !ticker.includes('.')) {
        const company = {
          ticker,
          name,
          sector,
          industry,
          founded
        };
        companies.push(company);
      }
    });

    await Company.bulkCreate(companies, {
      updateOnDuplicate: ['name', 'sector', 'industry', 'founded']
    });

    logger.info('S&P 500 company list refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing S&P 500 company list:', error);
  }
};
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
  const maxRetries = 5;
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const queryOptions = {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      };

      const result = await yahooFinance.historical(ticker, queryOptions);
      return result;
    } catch (error) {
      logger.error(`Error fetching data for ${ticker}:`, error);
      logger.error(`Error details:`, JSON.stringify(error, null, 2));

      if (error.message.includes('HTTP 404 Not Found')) {
        logger.error(`Ticker not found: ${ticker}`);
      } else if (error.name === 'ValidationError') {
        logger.error(`Data validation error for ${ticker}:`, error.message);
      }

      if (retries < maxRetries) {
        retries++;
        await new Promise(res => setTimeout(res, 10000 * retries)); // Increase delay with each retry
      } else {
        throw error;
      }
    }
  }

  logger.error(`Failed to retrieve data for ticker: ${ticker}`);
  return null;
}

export async function updatestock_prices(ticker, stockData) {
  try {
    for (const data of stockData) {
      await StockPrice.upsert({
        ticker: ticker,
        date: data.date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjustedClose: data.adjClose
      });
    }
    logger.info(`Updated stock prices for ${ticker}`);
  } catch (error) {
    logger.error(`Error updating stock prices for ${ticker}:`, error);
    throw error;
  }
}

export async function updateAllstock_prices() {
  const client = await pool.connect();
  try {
      const tickers = await getTickers();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);

      let updatedCount = 0;
      let errorCount = 0;

      for (const ticker of tickers) {
          logger.info(`Processing ${ticker}...`);
          try {
              const stockData = await getStockData(ticker, startDate, endDate);
              if (stockData && stockData.length > 0) {
                  await updatestock_prices(ticker, stockData);
                  logger.info(`Updated stock prices for ${ticker}`);
                  updatedCount++;
              } else {
                  logger.info(`No data available for ${ticker}`);
              }
          } catch (error) {
              logger.error(`Error processing ${ticker}:`, error);
              errorCount++;
          }
      }

      return {
          updatedCount,
          errorCount,
          totalProcessed: tickers.length
      };
  } finally {
      client.release();
  }
}

export async function checkInvalidTickers() {
  try {
    const companies = await Company.findAll();
    const invalidTickers = [];

    for (const company of companies) {
      try {
        const ticker = company.ticker;
        const result = await yahooFinance.quote(ticker);
        
        if (!result || !result.regularMarketPrice) {
          invalidTickers.push(ticker);
          logger.warn(`Invalid ticker found: ${ticker}`);
        }
      } catch (error) {
        if (error.message.includes('HTTP 404 Not Found')) {
          invalidTickers.push(company.ticker);
          logger.warn(`Invalid ticker found: ${company.ticker}`);
        } else {
          logger.error(`Error checking ticker ${company.ticker}:`, error);
        }
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (invalidTickers.length > 0) {
      logger.info(`Found ${invalidTickers.length} invalid tickers: ${invalidTickers.join(', ')}`);
      
      // Remove invalid tickers from the database
      await Company.destroy({
        where: {
          ticker: {
            [Op.in]: invalidTickers
          }
        }
      });

      logger.info(`Removed ${invalidTickers.length} invalid tickers from the database`);
    } else {
      logger.info('No invalid tickers found');
    }
  } catch (error) {
    logger.error('Error checking for invalid tickers:', error);
  }
}

export function startPriceUpdaterJob() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const priceUpdaterPath = path.join(__dirname, '..', '..', 'scripts', 'priceUpdater.js');

  cron.schedule('0 10-17 * * 1-5', () => {
    logger.info('Running hourly price update job');
    exec(`node ${priceUpdaterPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error running price updater: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.error(`Price updater stderr: ${stderr}`);
        return;
      }
      logger.info(`Price updater stdout: ${stdout}`);
    });
  }, {
    timezone: "America/New_York"
  });
}

// Add this at the end of the file to allow running the script directly
if (process.argv[2] === 'refresh') {
  refreshSP500List().then(() => process.exit());
} else if (process.argv[2] === 'update') {
  updateAllstock_prices().then(() => process.exit());
}
