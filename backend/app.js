// ============================================================
// WOLF SOCIETY ESPORTS – COMPLETE BACKEND API
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const teamsRoutes = require('./routes/teams');
const playersRoutes = require('./routes/players');
const matchesRoutes = require('./routes/matches');
const announcementsRoutes = require('./routes/announcements');
const shopRoutes = require('./routes/shop');

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
});
app.use('/api', limiter);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/shop', shopRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal server error',
        status
    });
});

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🐺 Wolf Society API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
