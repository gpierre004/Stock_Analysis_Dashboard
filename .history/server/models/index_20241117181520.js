import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import StockPriceModel from './StockPrice.js';
import TransactionModel from './Transaction.js';
import CompanyModel from './Company.js';
import WatchListModel from './WatchList.js';
import UserModel from './User.js';

dotenv.config();

// Use the same database configuration as priceUpdater.js
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'sp500_analysis',
  username: 'postgres',
  password: '1215',
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

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

export {
  sequelize,
  Company,
  StockPrice,
  WatchList,
  User,
  Transaction
};
