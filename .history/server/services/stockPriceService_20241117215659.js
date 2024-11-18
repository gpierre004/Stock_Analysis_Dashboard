import { StockPrice, Company } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

export async function getLatestStockPrices() {
  try {
    const latestPrices = await StockPrice.findAll({
      attributes: ['CompanyTicker', 'adjustedClose', 'volume', 'date'],
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
      CompanyTicker: price.CompanyTicker,
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
      where: { CompanyTicker: ticker },
      order: [['date', 'DESC']],
      attributes: [
        'CompanyTicker',
        [sequelize.literal('volume'), 'volume'],
        [sequelize.literal('(SELECT AVG(volume) FROM "StockPrices" WHERE "CompanyTicker" = :ticker)'), 'avg_volume'],
        [sequelize.literal('(SELECT SUM(volume * adjustedClose) / SUM(volume) FROM "StockPrices" WHERE "CompanyTicker" = :ticker ORDER BY date DESC LIMIT 20)'), 'vwap']
      ],
      replacements: { ticker },
      raw: true
    });

    logger.info(`Fetched volume analysis for ${ticker}`);
    return {
      CompanyTicker: volumeAnalysis.CompanyTicker,
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
      where: { CompanyTicker: ticker },
      order: [['date', 'DESC']],
      attributes: [
        'CompanyTicker',
        [sequelize.literal('adjustedClose'), 'current_price'],
        [sequelize.literal(`
          (SELECT (adjustedClose - LAG(adjustedClose, 20) OVER (ORDER BY date)) / LAG(adjustedClose, 20) OVER (ORDER BY date) * 100 
           FROM "StockPrices" 
           WHERE "CompanyTicker" = :ticker 
           ORDER BY date DESC 
           LIMIT 1
          )
        `), 'price_change_20d'],
        [sequelize.literal(`
          (SELECT AVG(adjustedClose) 
           FROM "StockPrices" 
           WHERE "CompanyTicker" = :ticker 
           ORDER BY date DESC 
           LIMIT 20
          )
        `), 'sma20'],
        [sequelize.literal(`
          (SELECT AVG(volume) 
           FROM "StockPrices" 
           WHERE "CompanyTicker" = :ticker 
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
      CompanyTicker: technicalIndicators.CompanyTicker,
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
