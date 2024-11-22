import { Company, StockPrice, WatchList, User } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';

// Constants
const DAYS_THRESHOLD = 90; // Don't add stocks that were added in the last 90 days
const PRICE_DROP_THRESHOLD = 0.25; // 25% below 52-week high
const RECOVERY_THRESHOLD = 0.70; // Stock should be at least 70% of its 52-week high
const VOLUME_INCREASE_THRESHOLD = 1.5; // 50% increase in volume compared to average
const WATCH_LIST_THRESHOLD = 0.25; // 25% below 52-week high
const TREND_PERIOD = 1080; // 1080-day moving average for long-term trend

export async function updateWatchListPriceChange() {
  try {
    const watchListItems = await WatchList.findAll({
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

    return { message: 'Watch list price changes updated successfully' };
  } catch (error) {
    throw new Error('Unable to update watch list price changes');
  }
}

export async function getWatchList(userId) {
  try {
    return await WatchList.findAll({
      where: { UserId: userId },
      include: [{ model: Company, attributes: ['name', 'sector'] }],
      order: [['dateAdded', 'DESC']]
    });
  } catch (error) {
    throw new Error('Unable to fetch watch list');
  }
}

async function getPotentialStocks() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return await StockPrice.findAll({
      attributes: [
          'ticker',
          [Sequelize.fn('MAX', Sequelize.col('high')), '52WeekHigh'],
          [Sequelize.fn('AVG', Sequelize.col('close')), 'avgClose'],
          [Sequelize.fn('AVG', Sequelize.col('volume')), 'avgVolume'],
          [Sequelize.literal('(SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)'), 'currentPrice'],
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
          // Price is 25% or more below 52-week high
          Sequelize.literal(`
              (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
              <= (1 - 0.25) * MAX("StockPrice"."high")
          `),
          // Price is above 70% of 52-week high (to avoid falling knives)
          Sequelize.literal(`
              (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
              >= 0.70 * MAX("StockPrice"."high")
          `),
          // Volume is increasing (50% above average)
          Sequelize.literal(`
              (SELECT volume FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)
              >= 1.5 * AVG("StockPrice"."volume")
          `),
      // New condition: Current price must be over \$85
      Sequelize.literal(`
        (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1) 
        > 85
    `)
),
      order: [[Sequelize.literal('MAX("StockPrice"."high") - (SELECT close FROM "StockPrices" sp WHERE sp."ticker" = "StockPrice"."ticker" ORDER BY date DESC LIMIT 1)'), 'DESC']]
  });
}

async function addToWatchList(userId, potentialStocks) {
  let addedCount = 0;
  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // First, remove stocks older than 90 days
  await WatchList.destroy({
      where: {
          UserId: userId,
          dateAdded: { [Op.lt]: ninetyDaysAgo }
      }
  });

  for (const stock of potentialStocks) {
      // Check if stock was added in the last 90 days
      const recentEntry = await WatchList.findOne({
          where: {
              ticker: stock.ticker,
              UserId: userId,
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
              UserId: userId,
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

  return addedCount;
}


export async function updateWatchListPrices() {
  try {
    const watchListItems = await WatchList.findAll({
      attributes: ['id', 'ticker']
    });

    for (const item of watchListItems) {
      const latestPrice = await StockPrice.findOne({
        where: { ticker: item.ticker },
        order: [['date', 'DESC']],
        attributes: ['close']
      });

      if (latestPrice) {
        await WatchList.update(
          { currentPrice: latestPrice.close },
          { where: { id: item.id } }
        );
      }
    } 
    logger.info('Watch list prices updated successfully');
    return { message: 'Watch list prices updated successfully' };
  } catch (error) {
    logger.error('Error updating watch list prices:', error);
    throw new Error('Unable to update watch list prices');
  }
}

// Update the cleanup function
export async function cleanupWatchList() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - DAYS_THRESHOLD);

    const { count } = await WatchList.destroy({
      where: {
        dateAdded: { [Op.lt]: ninetyDaysAgo }
      }
    });

    return { message: `Watch list cleaned up. ${count} old items removed.` };
  } catch (error) {
    logger.error('Error cleaning up watch list:', error);
    throw new Error('Unable to clean up watch list');
  }
}