const Team = require('../models/Team');
const { validationResult } = require('express-validator');

/**
 * Get all teams
 * GET /api/teams
 * Public
 */
exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.findAll();
    res.json(teams);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single team by ID
 * GET /api/teams/:id
 * Public
 */
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new team
 * POST /api/teams
 * Admin/Manager only
 */
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

/**
 * Update a team
 * PUT /api/teams/:id
 * Admin/Manager only
 */
exports.updateTeam = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const updated = await Team.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a team
 * DELETE /api/teams/:id
 * Admin/Manager only
 */
exports.deleteTeam = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    await Team.delete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    next(err);
  }
};
