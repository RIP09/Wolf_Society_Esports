const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  type: {
    type: DataTypes.ENUM('video', 'image', 'stream', 'article'),
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  thumbnail_url: {
    type: DataTypes.STRING(255),
  },
  uploader_id: {
    type: DataTypes.INTEGER,
    references: { model: User, key: 'id' },
    onDelete: 'SET NULL',
  },
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  scheduled_date: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'content',
});

module.exports = Content;
