// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config(); // <-- LOAD .env FILE

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Read from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/matches', require('./routes/matches'));
app.use('/api/rosters', require('./routes/rosters'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Socket.io – staff realtime
io.on('connection', (socket) => {
  console.log('Staff connected:', socket.id);
  // ... rest of your socket logic
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
