import { Company, StockPrice, WatchList, User } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

// Constants
const DAYS_THRESHOLD = 90; // Don't add stocks that were added in the last 90 days
const PRICE_DROP_THRESHOLD = 0.25; // 25% below 52-week high
const RECOVERY_THRESHOLD = 0.70; // Stock should be at least 70% of its 52-week high
const VOLUME_INCREASE_THRESHOLD = 1.5; // 50% increase in volume compared to average
const WATCH_LIST_THRESHOLD = 0.25; // 25% below 52-week high
const TREND_PERIOD = 1080; // 1080-day moving average for long-term trend
const DEFAULT_USER_ID = 3; // Default user ID for system-generated entries

async function ensureDefaultUser() {
  try {
    let defaultUser = await User.findByPk(DEFAULT_USER_ID);
    if (!defaultUser) {
      defaultUser = await User.create({
        id: DEFAULT_USER_ID,
        username: 'gbeljour',
        email: 'gbeljour@me.com',
        password: '1215' // You might want to use a more secure password
      });
      logger.info('Created default user successfully');
    }
    return defaultUser;
  } catch (error) {
    logger.error('Error ensuring default user: ' + error.message);
    throw new Error('Unable to ensure default user exists');
  }
}

export async function updateWatchListPriceChange() {
  try {
    await ensureDefaultUser();
    const watchListItems = await WatchList.findAll({
      where: { UserId: DEFAULT_USER_ID },
      attributes: [
        'id', 
        'currentPrice', 
        'priceWhenAdded'
      ]
    });

    for (const item of watchListItems) {
      const priceChange = ((item.currentPrice - item.priceWhenAdded) / item.priceWhenAdded * 100).toFixed(2);
      await item.update({ priceChange });
    }

    logger.info('Watch list price changes updated successfully');
    return { message: 'Watch list price changes updated successfully' };
  } catch (error) {
    logger.error('Error updating watch list price changes: ' + error.message);
    throw new Error('Unable to update watch list price changes');
  }
}

export async function getWatchList() {
  try {
    await ensureDefaultUser();
    const watchList = await WatchList.findAll({
      where: { UserId: DEFAULT_USER_ID },
      include: [{ model: Company, attributes: ['name', 'sector'] }],
      order: [['dateAdded', 'DESC']]
    });
    
    logger.info('Fetched watch list successfully');
    return watchList;
  } catch (error) {
    logger.error('Error fetching watch list: ' + error.message);
    throw new Error('Unable to fetch watch list');
  }
}

async function getPotentialStocks() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    const potentialStocks = await StockPrice.findAll({
      attributes: [
        'ticker',
        [Sequelize.fn('MAX', Sequelize.col('high')), '52WeekHigh'],
        [Sequelize.fn('AVG', Sequelize.col('close')), 'avgClose'],
        [Sequelize.fn('AVG', Sequelize.col('volume')), 'avgVolume'],
        [Sequelize.literal('(SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)'), 'currentPrice'],
        [Sequelize.literal('(SELECT volume FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)'), 'currentVolume'],
      ],
      include: [{ 
        model: Company,
        attributes: ['name', 'sector', 'industry']
      }],
      where: {
        date: { [Op.gte]: oneYearAgo }
      },
      group: ['ticker', 'Company.ticker', 'Company.name', 'Company.sector', 'Company.industry'],
      having: Sequelize.and(
        Sequelize.literal(`
          (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
          <= (1 - 0.25) * MAX("StockPrice"."high")
        `),
        Sequelize.literal(`
          (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
          >= 0.70 * MAX("StockPrice"."high")
        `),
        Sequelize.literal(`
          (SELECT volume FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)
          >= 1.5 * AVG("StockPrice"."volume")
        `),
        Sequelize.literal(`
          (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
          > 85
        `)
      ),
      order: [[Sequelize.literal('MAX("StockPrice"."high") - (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)'), 'DESC']]
    });

    logger.info(`Found ${potentialStocks.length} potential stocks`);
    return potentialStocks;
  } catch (error) {
    logger.error('Error finding potential stocks: ' + error.message);
    throw new Error('Unable to find potential stocks');
  }
}

async function addToWatchList(potentialStocks) {
  let addedCount = 0;
  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    // Ensure default user exists before proceeding
    await ensureDefaultUser();

    // First, remove stocks older than 90 days for the default user
    await WatchList.destroy({
      where: {
        UserId: DEFAULT_USER_ID,
        dateAdded: { [Op.lt]: ninetyDaysAgo }
      }
    });

    for (const stock of potentialStocks) {
      // Check if stock was added in the last 90 days for the default user
      const recentEntry = await WatchList.findOne({
        where: {
          ticker: stock.ticker,
          UserId: DEFAULT_USER_ID,
          dateAdded: { [Op.gte]: ninetyDaysAgo }
        }
      });

      if (!recentEntry) {
        const currentPrice = parseFloat(stock.dataValues.currentPrice);
        const weekHigh52 = parseFloat(stock.dataValues['52WeekHigh']);
        const percentBelow52WeekHigh = ((weekHigh52 - currentPrice) / weekHigh52 * 100).toFixed(2);
        const volumeIncrease = (parseFloat(stock.dataValues.currentVolume) / parseFloat(stock.dataValues.avgVolume) * 100 - 100).toFixed(2);

        await WatchList.create({
          ticker: stock.ticker,
          UserId: DEFAULT_USER_ID,
          dateAdded: today,
          reason: `Trading ${percentBelow52WeekHigh}% below 52-week high with ${volumeIncrease}% volume increase`,
          sector: stock.Company.sector,
          industry: stock.Company.industry,
          priceWhenAdded: currentPrice,
          currentPrice,
          weekHigh52,
          percentBelow52WeekHigh,
          avgClose: parseFloat(stock.dataValues.avgClose),
          metrics: {
            volumeIncrease: volumeIncrease,
            industry: stock.Company.industry,
            priceToAvg: (currentPrice / parseFloat(stock.dataValues.avgClose)).toFixed(2)
          }
        });
        addedCount++;
      }
    }

    logger.info(`Added ${addedCount} new stocks to watch list`);
    return addedCount;
  } catch (error) {
    logger.error('Error adding stocks to watch list: ' + error.message);
    throw new Error('Unable to add stocks to watch list');
  }
}

export async function updateWatchListPrices() {
  try {
    await ensureDefaultUser();
    const watchListItems = await WatchList.findAll({
      where: { UserId: DEFAULT_USER_ID },
      attributes: ['id', 'ticker', 'priceWhenAdded']
    });

    for (const item of watchListItems) {
      const latestPrice = await StockPrice.findOne({
        where: { ticker: item.ticker },
        order: [['date', 'DESC']],
        attributes: ['close']
      });

      if (latestPrice) {
        const currentPrice = latestPrice.close;
        const priceChange = ((currentPrice - item.priceWhenAdded) / item.priceWhenAdded * 100).toFixed(2);
        
        await WatchList.update(
          { 
            currentPrice,
            priceChange
          },
          { where: { id: item.id } }
        );
      }
    } 
    
    logger.info('Watch list prices updated successfully');
    return { message: 'Watch list prices updated successfully' };
  } catch (error) {
    logger.error('Error updating watch list prices: ' + error.message);
    throw new Error('Unable to update watch list prices');
  }
}

export async function cleanupWatchList() {
  try {
    await ensureDefaultUser();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - DAYS_THRESHOLD);

    const { count } = await WatchList.destroy({
      where: {
        UserId: DEFAULT_USER_ID,
        dateAdded: { [Op.lt]: ninetyDaysAgo }
      }
    });

    logger.info(`Watch list cleaned up. ${count} old items removed.`);
    return { message: `Watch list cleaned up. ${count} old items removed.` };
  } catch (error) {
    logger.error('Error cleaning up watch list: ' + error.message);
    throw new Error('Unable to clean up watch list');
  }
}

export async function refreshWatchList() {
  try {
    // Ensure default user exists before proceeding with refresh
    await ensureDefaultUser();
    
    const potentialStocks = await getPotentialStocks();
    const addedCount = await addToWatchList(potentialStocks);
    
    logger.info(`Watch list refreshed. Added ${addedCount} new stocks.`);
    return { message: `Watch list refreshed. Added ${addedCount} new stocks.` };
  } catch (error) {
    logger.error('Error refreshing watch list: ' + error.message);
    throw new Error('Unable to refresh watch list');
  }
}
