import cron from 'node-cron';
import { updateWatchListPrices } from './watchlistService.js';
import logger from '../utils/logger.js';

// Function to check if it's a weekday during business hours (9 AM to 5 PM)
function isWeekdayBusinessHours() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const hour = now.getHours();

  // Check if it's a weekday (Monday to Friday) and between 9 AM and 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

// Scheduled task to update watchlist prices hourly during weekday business hours
export function scheduleWatchlistPriceUpdates() {
  // Run every hour at the top of the hour during weekday business hours
  cron.schedule('0 * * * *', async () => {
    if (isWeekdayBusinessHours()) {
      try {
        logger.info('Starting scheduled watchlist price update');
        const result = await updateWatchListPrices();
        logger.info(`Scheduled watchlist price update completed: ${result.message}`);
      } catch (error) {
        logger.error(`Error in scheduled watchlist price update: ${error.message}`);
      }
    } else {
      logger.info('Skipping watchlist price update - outside business hours');
    }
  });

  logger.info('Watchlist price update scheduler initialized');
}
