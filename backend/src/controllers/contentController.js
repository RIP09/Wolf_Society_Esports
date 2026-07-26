const { Content, User } = require('../models');
const { validationResult } = require('express-validator');

exports.getContent = async (req, res, next) => {
  try {
    const where = {};
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      where.status = 'published';
    }
    const content = await Content.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'full_name'] }],
      order: [['upload_date', 'DESC']],
    });
    res.json(content);
  } catch (err) {
    next(err);
  }
};

exports.getContentItem = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'full_name'] }],
    });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    if (content.status !== 'published' && (!req.user || !['admin', 'manager'].includes(req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(content);
  } catch (err) {
    next(err);
  }
};

exports.createContent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!req.user || !['admin', 'manager', 'content_creator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const content = await Content.create({
      ...req.body,
      uploader_id: req.user.id,
    });
    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    // Only allow update by owner or admin/manager
    if (!['admin', 'manager'].includes(req.user.role) && req.user.id !== content.uploader_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await content.update(req.body);
    res.json(content);
  } catch (err) {
    next(err);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    await content.destroy();
    res.json({ message: 'Content deleted' });
  } catch (err) {
    next(err);
  }
};
