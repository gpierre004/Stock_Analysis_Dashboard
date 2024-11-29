import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const StockPrice = sequelize.define('StockPrice', {
    ticker: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      field: 'ticker',
      references: {
        model: 'Companies',
        key: 'ticker'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true,
      field: 'date'
    },
    open: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'open'
    },
    high: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'high'
    },
    low: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'low'
    },
    close: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'close'
    },
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'volume'
    },
    adjustedClose: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'adjustedClose'
    }
  }, {
    tableName: 'stock_prices', // Explicitly set table name
    timestamps: false, // Disable timestamps
    indexes: [
      {
        unique: true,
        fields: ['ticker', 'date']
      }
    ]
  });

  return StockPrice;
};
