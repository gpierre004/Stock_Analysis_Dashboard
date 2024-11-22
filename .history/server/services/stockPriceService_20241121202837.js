import { StockPrice, Company, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

export async function getLatestStockPrices() {
  try {
    // Find the most recent date in the StockPrices table
    const latestDate = await StockPrice.max('date');

    // Fetch the latest prices for each unique ticker on that date
    const latestPrices = await StockPrice.findAll({
      attributes: [
        'ticker', 
        [sequelize.col('adjustedClose'), 'adjustedClose'], 
        'volume', 
        'date'
      ],
      where: {
        date: latestDate,
        adjustedClose: {
          [Op.not]: null
        }
      },
      include: [{
        model: Company,
        attributes: ['name', 'sector']
      }],
      raw: true
    });

    // Transform the results to match the expected interface
    const transformedPrices = latestPrices.map(price => ({
      ticker: price.ticker,
      adjustedClose: Number(price.adjustedClose),
      volume: Number(price.volume),
      date: price.date
    }));

    logger.info(`Fetched latest stock prices for ${transformedPrices.length} companies`);
    return transformedPrices;
  } catch (error) {
    logger.error(`Error fetching latest stock prices: ${error.message}`);
    throw error;
  }
}

export async function getVolumeAnalysis(ticker) {
  try {
    const volumeAnalysis = await sequelize.query(`
      WITH LatestData AS (
        SELECT 
          "ticker",
          volume::numeric::float8 as volume,
          AVG(volume::numeric::float8) OVER (
            PARTITION BY "ticker"
            ORDER BY date 
            ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
          ) as avg_volume,
          ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
        FROM public."StockPrices"
        WHERE "ticker" = :ticker
          AND volume IS NOT NULL
      )
      SELECT 
        "ticker",
        volume,
        avg_volume
      FROM LatestData
      WHERE rn = 1
    `, {
      replacements: { ticker },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (!volumeAnalysis.length) {
      throw new Error(`No volume data found for ticker ${ticker}`);
    }

    const result = volumeAnalysis[0];
    logger.info(`Fetched volume analysis for ${ticker}`);
    return {
      ticker: result.ticker,
      volume: Number(result.volume),
      avg_volume: Number(result.avg_volume)
    };
  } catch (error) {
    logger.error(`Error fetching volume analysis for ${ticker}: ${error.message}`);
    throw error;
  }
}

export async function getTechnicalIndicators(ticker) {
  try {
    const technicalIndicators = await sequelize.query(`
      WITH LatestData AS (
        SELECT 
          "ticker",
          adjustedClose::numeric::float8 as current_price,
          LAG(adjustedClose::numeric::float8, 20) OVER (
            PARTITION BY "ticker" 
            ORDER BY date
          ) as price_20d_ago,
          AVG(adjustedClose::numeric::float8) OVER (
            PARTITION BY "ticker"
            ORDER BY date
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
          ) as sma20,
          AVG(volume::numeric::float8) OVER (
            PARTITION BY "ticker"
            ORDER BY date
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
          ) as avg_volume,
          ROW_NUMBER() OVER (PARTITION BY "ticker" ORDER BY date DESC) as rn
        FROM public."StockPrices"
        WHERE "ticker" = :ticker
          AND adjustedClose IS NOT NULL
      )
      SELECT 
        "ticker",
        current_price,
        CASE 
          WHEN price_20d_ago IS NOT NULL THEN
            ((current_price - price_20d_ago) / NULLIF(price_20d_ago, 0) * 100)::numeric(10,2)
          ELSE NULL
        END as price_change_20d,
        sma20,
        avg_volume
      FROM LatestData
      WHERE rn = 1
    `, {
      replacements: { ticker },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (!technicalIndicators.length) {
      throw new Error(`No technical indicators found for ticker ${ticker}`);
    }

    const result = technicalIndicators[0];
    logger.info(`Fetched technical indicators for ${ticker}`);
    return {
      ticker: result.ticker,
      current_price: Number(result.current_price),
      price_change_20d: result.price_change_20d !== null 
        ? Number(result.price_change_20d) 
        : null,
      sma20: Number(result.sma20),
      avg_volume: Number(result.avg_volume)
    };
  } catch (error) {
    logger.error(`Error fetching technical indicators for ${ticker}: ${error.message}`);
    throw error;
  }
}
