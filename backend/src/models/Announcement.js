const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  author_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' },
    onDelete: 'SET NULL',
  },
  category: {
    type: DataTypes.STRING(20),
    defaultValue: 'news',
  },
  image_url: {
    type: DataTypes.STRING(255),
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  published_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'announcements',
});

module.exports = Announcement;
