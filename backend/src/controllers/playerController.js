const Player = require('../models/Player');
const { validationResult } = require('express-validator');

exports.getPlayers = async (req, res, next) => {
  try {
    const players = await Player.findAll();
    res.json(players);
  } catch (err) {
    next(err);
  }
};

exports.getPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
};

exports.createPlayer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    const user = req.user;
    if (!['admin', 'manager'].includes(user.role) && user.id !== player.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await Player.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    await Player.delete(req.params.id);
    res.json({ message: 'Player deleted' });
  } catch (err) {
    next(err);
  }
};
