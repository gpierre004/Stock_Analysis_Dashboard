import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('StockPrice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    open: DataTypes.FLOAT,
    high: DataTypes.FLOAT,
    low: DataTypes.FLOAT,
    close: DataTypes.FLOAT,
    volume: DataTypes.BIGINT,
    adjustedClose: DataTypes.FLOAT,
    CompanyTicker: {
      type: DataTypes.STRING,
      references: {
        model: 'Companies',
        key: 'ticker'
      }
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['CompanyTicker', 'date']
      }
    ]
  });
};