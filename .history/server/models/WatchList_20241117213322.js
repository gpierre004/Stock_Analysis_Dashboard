import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const WatchList = sequelize.define('WatchList', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    CompanyTicker: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ticker'
      }
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    dateAdded: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sector: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    priceWhenAdded: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currentPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    weekHigh52: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    percentBelow52WeekHigh: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    avgClose: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    priceChange: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'WatchLists',
    timestamps: true
  });

  return WatchList;
};