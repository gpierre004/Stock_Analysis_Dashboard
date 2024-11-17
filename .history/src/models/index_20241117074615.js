import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import StockPriceModel from '.';
import TransactionModel from './Transaction.js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false
});

const Company = CompanyModel(sequelize);
const StockPrice = StockPriceModel(sequelize);
const WatchList = WatchListModel(sequelize);
const User = UserModel(sequelize);
const Transaction = TransactionModel(sequelize);

// Define relationships
Company.hasMany(StockPrice);
StockPrice.belongsTo(Company);

Company.hasMany(WatchList);
WatchList.belongsTo(Company);

User.hasMany(WatchList);
WatchList.belongsTo(User);

Transaction.belongsTo(Company, { foreignKey: 'ticker', targetKey: 'ticker' });

export {
  sequelize,
  Company,
  StockPrice,
  WatchList,
  User,
  Transaction
};