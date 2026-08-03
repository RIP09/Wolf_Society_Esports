// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

// ============================================================
// LOGGER
// ============================================================
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (!fs.existsSync('logs')) fs.mkdirSync('logs');

// ============================================================
// ENVIRONMENT
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const PORT = process.env.PORT || 5000;

const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:');
    missing.forEach(v => logger.error(`   - ${v}`));
    process.exit(1);
}

logger.info('✅ Environment variables loaded successfully');

// ============================================================
// SUPABASE CLIENT
// ============================================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: FRONTEND_URL || '*' }
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors({ origin: FRONTEND_URL || '*', credentials: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// MULTER CONFIG
// ============================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(null, mime && ext);
    }
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        success: true,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        filename: req.file.filename
    });
});

// API Routes
app.use('/api/matches', require('./routes/matches')(supabase));
app.use('/api/rosters', require('./routes/rosters')(supabase));
app.use('/api/webhooks', require('./routes/webhooks')(supabase));

// ============================================================
// SOCKET.IO – real‑time
// ============================================================
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-staff', (role) => {
        if (['admin', 'manager', 'coach'].includes(role)) {
            socket.join('staff-room');
            logger.info(`User ${socket.id} joined staff room as ${role}`);
        }
    });

    socket.on('match-update', async (data) => {
        try {
            const { matchId, homeScore, awayScore, status, timeElapsed } = data;
            const { error } = await supabase
                .from('matches')
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    status: status || 'live',
                    time_elapsed: timeElapsed || null
                })
                .eq('id', matchId);

            if (error) throw error;
            io.emit('match-refresh', data);
            logger.info(`Match ${matchId} updated: ${homeScore}-${awayScore}`);
        } catch (err) {
            logger.error(`Match update error: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('scrim-update', async (data) => {
        try {
            const { error } = await supabase
                .from('scrims')
                .upsert(data);

            if (error) throw error;
            io.to('staff-room').emit('scrim-refresh');
            logger.info(`Scrim updated: ${JSON.stringify(data)}`);
        } catch (err) {
            logger.error(`Scrim update error: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('staff-chat', (msg) => {
        io.to('staff-room').emit('staff-message', {
            ...msg,
            timestamp: new Date().toISOString(),
            socketId: socket.id
        });
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    logger.error(err.stack);
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'File too large. Max 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ============================================================
// START
// ============================================================
server.listen(PORT, () => {
    logger.info(`🚀 Backend running on port ${PORT}`);
    logger.info(`📡 Supabase URL: ${SUPABASE_URL}`);
    logger.info(`🌐 Frontend URL: ${FRONTEND_URL}`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing...');
    server.close(() => process.exit(0));
});

module.exports = { app, server, io, supabase };
