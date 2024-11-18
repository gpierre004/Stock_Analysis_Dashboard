import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Company = sequelize.define('Company', {
    ticker: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sector: {
      type: DataTypes.STRING,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Companies',
    timestamps: true
  });

  return Company;
};
