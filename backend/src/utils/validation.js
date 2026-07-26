const { body } = require('express-validator');

exports.validateRegister = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name required'),
  body('role').optional().isIn(['player', 'content_creator', 'manager', 'admin']),
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.validatePlayer = [
  body('display_name').notEmpty().withMessage('Display name required'),
  body('user_id').isInt().withMessage('User ID must be integer'),
];

exports.validateTeam = [
  body('name').notEmpty().withMessage('Team name required'),
  body('tag').notEmpty().withMessage('Team tag required'),
  body('game').notEmpty().withMessage('Game required'),
];

exports.validateMatch = [
  body('team_id').isInt().withMessage('Team ID required'),
  body('opponent').notEmpty().withMessage('Opponent required'),
  body('game').notEmpty().withMessage('Game required'),
  body('match_date').isDate().withMessage('Valid date required'),
];

exports.validateAnnouncement = [
  body('title').notEmpty().withMessage('Title required'),
  body('content').notEmpty().withMessage('Content required'),
];

exports.validateContent = [
  body('title').notEmpty().withMessage('Title required'),
  body('type').isIn(['video', 'image', 'stream', 'article']).withMessage('Invalid content type'),
  body('url').isURL().withMessage('Valid URL required'),
];

exports.validateContract = [
  body('user_id').isInt().withMessage('User ID required'),
  body('type').isIn(['player', 'content', 'sponsorship']).withMessage('Invalid contract type'),
  body('start_date').isDate().withMessage('Valid start date required'),
  body('end_date').isDate().withMessage('Valid end date required'),
];
