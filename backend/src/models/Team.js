const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tag: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  game: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  logo_url: {
    type: DataTypes.STRING(255),
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  draws: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'teams',
});

module.exports = Team;
