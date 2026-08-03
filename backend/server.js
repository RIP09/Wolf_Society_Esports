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
//  LOGGER (winston)
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

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// ============================================================
//  ENVIRONMENT VALIDATION
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

// ============================================================
//  SUPABASE CLIENT
// ============================================================
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
//  EXPRESS APP
// ============================================================
const app = express();
const server = http.createServer(app);

// ============================================================
//  SOCKET.IO
// ============================================================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// ============================================================
//  MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", SUPABASE_URL],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
//  MULTER CONFIGURATION (file uploads)
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ============================================================
//  ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// API Routes
app.use('/api/matches', require('./routes/matches'));
app.use('/api/rosters', require('./routes/rosters'));
app.use('/api/webhooks', require('./routes/webhooks'));

// ============================================================
//  SOCKET.IO EVENTS
// ============================================================
io.on('connection', (socket) => {
  logger.info(`Staff connected: ${socket.id}`);

  // Join staff room with role verification
  socket.on('join-staff', (role) => {
    if (['admin', 'manager', 'coach'].includes(role)) {
      socket.join('staff-room');
      logger.info(`User ${socket.id} joined staff room with role: ${role}`);
    } else {
      socket.emit('error', { message: 'Unauthorized role' });
    }
  });

  // Scrim updates
  socket.on('scrim-update', async (data) => {
    try {
      const { error } = await supabase.from('scrims').upsert(data);
      if (error) throw error;
      io.to('staff-room').emit('scrim-refresh');
      logger.info(`Scrim updated: ${JSON.stringify(data)}`);
    } catch (err) {
      logger.error(`Scrim update error: ${err.message}`);
      socket.emit('error', { message: 'Failed to update scrim' });
    }
  });

  // Staff chat
  socket.on('chat-message', (msg) => {
    io.to('staff-room').emit('new-message', {
      ...msg,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // Match update (real-time score)
  socket.on('match-score', async (data) => {
    try {
      const { matchId, homeScore, awayScore, status } = data;
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: status || 'live'
        })
        .eq('id', matchId);
      if (error) throw error;
      io.emit('match-refresh', { matchId, homeScore, awayScore, status });
      logger.info(`Match ${matchId} score updated: ${homeScore}-${awayScore}`);
    } catch (err) {
      logger.error(`Match score update error: ${err.message}`);
      socket.emit('error', { message: 'Failed to update match score' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Staff disconnected: ${socket.id}`);
  });
});

// ============================================================
//  ERROR HANDLING MIDDLEWARE
// ============================================================
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ============================================================
//  START SERVER
// ============================================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Supabase URL: ${SUPABASE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io, supabase };
