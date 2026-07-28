const Match = require('../models/Match');
const { validationResult } = require('express-validator');

exports.getMatches = async (req, res, next) => {
  try {
    const matches = await Match.findAll();
    res.json(matches);
  } catch (err) {
    next(err);
  }
};

exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (err) {
    next(err);
  }
};

exports.createMatch = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const match = await Match.create(req.body);
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
};

exports.updateMatch = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const updated = await Match.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteMatch = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    await Match.delete(req.params.id);
    res.json({ message: 'Match deleted' });
  } catch (err) {
    next(err);
  }
};
