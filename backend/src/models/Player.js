const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Team = require('./Team');

const Player = sequelize.define('Player', {
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
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING(255),
  },
  game: {
    type: DataTypes.STRING(50),
  },
  role: {
    type: DataTypes.STRING(50),
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'trial'),
    defaultValue: 'active',
  },
  team_id: {
    type: DataTypes.INTEGER,
    references: { model: Team, key: 'id' },
    onDelete: 'SET NULL',
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  social_links: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'players',
});

module.exports = Player;
