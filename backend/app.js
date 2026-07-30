require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// ─── Supabase Client ──────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// ─── JWT Helpers ─────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    if (error || !user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password_hash: hashed, full_name, role: role || 'player' }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'User created', user: { id: data.id, email, full_name, role: data.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
    },
  });
});

// ─── CRUD Routes ──────────────────────────────────────────────
// Helper: generic CRUD handler
function crudRouter(table, allowedFields = ['*']) {
  const router = express.Router();

  // GET all
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET single
  router.get('/:id', async (req, res) => {
    const { data, error } = await supabase.from(table).select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  });

  // POST (create)
  router.post('/', verifyToken, async (req, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { data, error } = await supabase.from(table).insert([req.body]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  });

  // PUT (update)
  router.put('/:id', verifyToken, async (req, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // DELETE
  router.delete('/:id', verifyToken, async (req, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { error } = await supabase.from(table).delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Deleted' });
  });

  return router;
}

// ─── Register CRUD Routes ─────────────────────────────────────
app.use('/api/teams', crudRouter('teams'));
app.use('/api/players', crudRouter('players'));
app.use('/api/matches', crudRouter('matches'));
app.use('/api/announcements', crudRouter('announcements'));
app.use('/api/content', crudRouter('content'));
app.use('/api/contracts', crudRouter('contracts'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
