const { Announcement, User } = require('../models');
const { validationResult } = require('express-validator');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const where = {};
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      where.published = true;
    }
    const announcements = await Announcement.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'full_name'] }],
      order: [['pinned', 'DESC'], ['published_at', 'DESC']],
    });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'full_name'] }],
    });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    if (!announcement.published && (!req.user || !['admin', 'manager'].includes(req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const announcement = await Announcement.create({
      ...req.body,
      author_id: req.user.id,
    });
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await announcement.update(req.body);
    res.json(announcement);
  } catch (err) {
    next(err);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await announcement.destroy();
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
};
