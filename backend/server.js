// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/matches', require('./routes/matches'));
app.use('/api/rosters', require('./routes/rosters'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Socket.io – staff realtime
io.on('connection', (socket) => {
  console.log('Staff connected:', socket.id);

  socket.on('join-staff', (role) => {
    if (['admin', 'manager', 'coach'].includes(role)) {
      socket.join('staff-room');
    }
  });

  socket.on('scrim-update', async (data) => {
    const { error } = await supabase.from('scrims').upsert(data);
    if (!error) {
      io.to('staff-room').emit('scrim-refresh');
    }
  });

  socket.on('chat-message', (msg) => {
    io.to('staff-room').emit('new-message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Staff disconnected:', socket.id);
  });
});

// Webhook endpoint example
app.post('/api/webhooks/match-result', async (req, res) => {
  const { matchId, homeScore, awayScore, status } = req.body;
  const { error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status })
    .eq('id', matchId);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
