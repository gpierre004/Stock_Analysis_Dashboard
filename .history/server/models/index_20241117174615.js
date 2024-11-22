import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import StockPriceModel from './StockPrice.js';
import TransactionModel from './Transaction.js';
import CompanyModel from './Company.js';
import WatchListModel from './WatchList.js';
import UserModel from './User.js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
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
