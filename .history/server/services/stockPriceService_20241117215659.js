import { StockPrice, Company } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

export async function getLateststock_prices() {
  try {
    const latestPrices = await StockPrice.findAll({
      attributes: ['ticker', 'adjustedClose', 'volume', 'date'],
      include: [{
        model: Company,
        attributes: ['name', 'sector']
      }],
      where: {
        date: {
          [Op.eq]: (
            await StockPrice.max('date')
          )
        }
      },
      order: [['date', 'DESC']],
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
    const volumeAnalysis = await StockPrice.findOne({
      where: { ticker: ticker },
      order: [['date', 'DESC']],
      attributes: [
        'ticker',
        [sequelize.literal('volume'), 'volume'],
        [sequelize.literal('(SELECT AVG(volume) FROM "stock_prices" WHERE "ticker" = :ticker)'), 'avg_volume'],
        [sequelize.literal('(SELECT SUM(volume * adjustedClose) / SUM(volume) FROM "stock_prices" WHERE "ticker" = :ticker ORDER BY date DESC LIMIT 20)'), 'vwap']
      ],
      replacements: { ticker },
      raw: true
    });

    logger.info(`Fetched volume analysis for ${ticker}`);
    return {
      ticker: volumeAnalysis.ticker,
      volume: Number(volumeAnalysis.volume),
      avg_volume: Number(volumeAnalysis.avg_volume),
      vwap: Number(volumeAnalysis.vwap)
    };
  } catch (error) {
    logger.error(`Error fetching volume analysis for ${ticker}: ${error.message}`);
    throw error;
  }
}

export async function getTechnicalIndicators(ticker) {
  try {
    const technicalIndicators = await StockPrice.findOne({
      where: { ticker: ticker },
      order: [['date', 'DESC']],
      attributes: [
        'ticker',
        [sequelize.literal('adjustedClose'), 'current_price'],
        [sequelize.literal(`
          (SELECT (adjustedClose - LAG(adjustedClose, 20) OVER (ORDER BY date)) / LAG(adjustedClose, 20) OVER (ORDER BY date) * 100 
           FROM "stock_prices" 
           WHERE "ticker" = :ticker 
           ORDER BY date DESC 
           LIMIT 1
          )
        `), 'price_change_20d'],
        [sequelize.literal(`
          (SELECT AVG(adjustedClose) 
           FROM "stock_prices" 
           WHERE "ticker" = :ticker 
           ORDER BY date DESC 
           LIMIT 20
          )
        `), 'sma20'],
        [sequelize.literal(`
          (SELECT AVG(volume) 
           FROM "stock_prices" 
           WHERE "ticker" = :ticker 
           ORDER BY date DESC 
           LIMIT 20
          )
        `), 'avg_volume']
      ],
      replacements: { ticker },
      raw: true
    });

    logger.info(`Fetched technical indicators for ${ticker}`);
    return {
      ticker: technicalIndicators.ticker,
      current_price: Number(technicalIndicators.current_price),
      price_change_20d: technicalIndicators.price_change_20d !== null 
        ? Number(technicalIndicators.price_change_20d) 
        : null,
      sma20: Number(technicalIndicators.sma20),
      avg_volume: Number(technicalIndicators.avg_volume)
    };
  } catch (error) {
    logger.error(`Error fetching technical indicators for ${ticker}: ${error.message}`);
    throw error;
  }
}
