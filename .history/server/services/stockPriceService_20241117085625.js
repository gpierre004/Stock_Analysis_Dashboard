// src/services/stockPriceService.js
import { StockPrice } from '../models/index.js';
import logger from '../utils/logger.js';
import { updateAllstock_prices } from './dataUpdate.js';

export async function startStockPriceUpdate() {
  try {
      logger.info('Starting stock price update');
      const result = await updateAllstock_prices();
      logger.info('Stock price update completed successfully');
      return { 
          success: true, 
          message: 'Stock price update completed successfully',
          details: result 
      };
  } catch (error) {
      logger.error('Error in stock price update:', error);
      throw error;
  }
}

export async function getstock_prices(ticker, limit = 30) {
  try {
    return await StockPrice.findAll({
      where: { ticker: ticker },
      order: [['date', 'DESC']],
      limit: limit
    });
  } catch (error) {
    logger.error('Error fetching stock prices:', error);
    throw new Error('Unable to fetch stock prices');
  }
}

export function getUpdateStatus() {
  // This is a simple implementation. You might want to use a more robust solution for production.
  return global.updateStatus || { status: 'unknown' };
}