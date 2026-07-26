const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
    onDelete: 'CASCADE',
  },
  type: {
    type: DataTypes.ENUM('player', 'content', 'sponsorship'),
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
  },
  details: {
    type: DataTypes.JSONB,
  },
}, {
  tableName: 'contracts',
});

module.exports = Contract;
