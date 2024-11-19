import { DataTypes } from 'sequelize';

export default (sequelize) => {
    return sequelize.define('Transaction', {
        purchase_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ticker: {
            type: DataTypes.STRING,
            allowNull: false
        },
        purchase_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('Buy', 'SELL'),
            allowNull: false
        },
        comment: {
            type: DataTypes.TEXT
        },
        purchase_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        portfolio_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        current_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    }, {
        tableName: 'transactions',
        timestamps: true
    });
};