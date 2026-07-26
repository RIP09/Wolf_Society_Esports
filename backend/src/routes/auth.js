const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateLogin, validateRegister } = require('../utils/validation');

router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hashed, full_name, role });
    res.status(201).json({ message: 'User created', user: { id: user.id, email, full_name, role } });
  } catch (err) { next(err); }
});

router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email, full_name: user.full_name, role: user.role } });
  } catch (err) { next(err); }
});

module.exports = router;
