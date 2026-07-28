const { body } = require('express-validator');
const yup = require('yup');

// Yup schemas for React Hook Form (shared)
const userSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  full_name: yup.string().required(),
  role: yup.string().oneOf(['player', 'content_creator', 'manager', 'admin']).default('player'),
});

const playerSchema = yup.object({
  user_id: yup.string().required(),
  display_name: yup.string().required(),
  game: yup.string(),
  role: yup.string(),
  status: yup.string().oneOf(['active', 'inactive', 'trial']),
  team_id: yup.string().nullable(),
});

// Express-validator middlewares
exports.validateRegister = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty(),
  body('role').optional().isIn(['player', 'content_creator', 'manager', 'admin']),
];

exports.validateLogin = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

exports.validatePlayer = [
  body('user_id').isUUID(),
  body('display_name').notEmpty(),
];
// ... add others similarly

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
