const Content = require('../models/Content');
const { validationResult } = require('express-validator');

exports.getContent = async (req, res, next) => {
  try {
    // Public sees only published; admins see all
    let query = {};
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      query.status = 'published';
    }
    const content = await Content.findAll(query);
    res.json(content);
  } catch (err) {
    next(err);
  }
};

exports.getContentItem = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);
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
    // Content creators, managers, admins can create
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
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    // Only owner, manager, admin can update
    if (!['admin', 'manager'].includes(req.user.role) && req.user.id !== content.uploader_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await Content.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    await Content.delete(req.params.id);
    res.json({ message: 'Content deleted' });
  } catch (err) {
    next(err);
  }
};
