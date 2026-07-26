const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Team = require('./Team');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Team, key: 'id' },
    onDelete: 'CASCADE',
  },
  opponent: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  game: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  match_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
  },
  result: {
    type: DataTypes.ENUM('upcoming', 'win', 'loss', 'draw'),
    defaultValue: 'upcoming',
  },
  score: {
    type: DataTypes.STRING(20),
  },
  maps: {
    type: DataTypes.JSONB,
  },
  vod_url: {
    type: DataTypes.STRING(255),
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'matches',
});

module.exports = Match;
