const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Player = require('../models/Player');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const bcrypt = require('bcryptjs');

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password, full_name, role } = req.body;
    const user = await User.create({ email, password, full_name, role });
    if (user.role === 'player') {
      await Player.create({ user_id: user.id, display_name: full_name });
    }
    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      message: 'User created',
      user: { id: user.id, email, full_name, role: user.role },
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    logger.info(`User logged in: ${email}`);
    res.json({
      token,
      user: { id: user.id, email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    next(err);
  }
};

exports.getMe = async (req, res) => {
  const user = req.user;
  res.json({
    user: { id: user.id, email, full_name: user.full_name, role: user.role },
  });
};
