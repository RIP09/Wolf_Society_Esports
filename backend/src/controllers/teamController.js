const { Team, Player } = require('../models');
const { validationResult } = require('express-validator');

exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      include: [{ model: Player, attributes: ['id', 'display_name'] }],
    });
    res.json(teams);
  } catch (err) {
    next(err);
  }
};

exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: Player, attributes: ['id', 'display_name'] }],
    });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    next(err);
  }
};

exports.createTeam = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const team = await Team.create(req.body);
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
};

exports.updateTeam = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    await team.update(req.body);
    res.json(team);
  } catch (err) {
    next(err);
  }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const team = await Team.findByPk(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    await team.destroy();
    res.json({ message: 'Team deleted' });
  } catch (err) {
    next(err);
  }
};
