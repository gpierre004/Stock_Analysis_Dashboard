import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import logger from '../utils/logger.js';

import StockPriceModel from './StockPrice.js';
import TransactionModel from './Transaction.js';
import CompanyModel from './Company.js';
import WatchListModel from './WatchList.js';
import UserModel from './User.js';

dotenv.config();

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sp500_analysis',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1215',
  logging: false
});

// Initialize models
const Company = CompanyModel(sequelize);
const StockPrice = StockPriceModel(sequelize);
const WatchList = WatchListModel(sequelize);
const User = UserModel(sequelize);
const Transaction = TransactionModel(sequelize);

// Define relationships
Company.hasMany(StockPrice, { foreignKey: 'ticker', sourceKey: 'ticker' });
StockPrice.belongsTo(Company, { foreignKey: 'ticker', targetKey: 'ticker' });

Company.hasMany(WatchList, { foreignKey: 'ticker', sourceKey: 'ticker' });
WatchList.belongsTo(Company, { foreignKey: 'ticker', targetKey: 'ticker' });

User.hasMany(WatchList);
WatchList.belongsTo(User);

Transaction.belongsTo(Company, { foreignKey: 'ticker', targetKey: 'ticker' });

// Synchronize database
async function syncDatabase() {
  try {
    // Test connection first
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Synchronize models without altering existing columns
    await sequelize.sync({ 
      alter: {
        drop: false // Prevent dropping columns
      }
    });
    logger.info('All models were synchronized successfully.');
  } catch (error) {
    logger.error('Unable to connect to or synchronize the database:', error);
    throw error;
  }
}

export {
  sequelize,
  Company,
  StockPrice,
  WatchList,
  User,
  Transaction,
  syncDatabase
};
