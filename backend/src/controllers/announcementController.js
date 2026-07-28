const Announcement = require('../models/Announcement');
const { validationResult } = require('express-validator');

exports.getAnnouncements = async (req, res, next) => {
  try {
    // Public sees only published; admin sees all
    let query = {};
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      query.published = true;
    }
    const announcements = await Announcement.findAll(query);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    // Check if published
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
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    const updated = await Announcement.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await Announcement.delete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
};
