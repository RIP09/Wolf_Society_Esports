const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Incoming webhook from a tournament API (e.g., match results)
router.post('/match-result', async (req, res) => {
  const { matchId, homeScore, awayScore, status, timeElapsed } = req.body;
  // Validate required fields
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { error } = await supabase
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: status || 'finished',
      time_elapsed: timeElapsed || null
    })
    .eq('id', matchId);
  if (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Database update failed' });
  }
  res.json({ success: true, matchId });
});

// Webhook for sponsor impression metrics (e.g., from a third‑party tracker)
router.post('/sponsor-impression', async (req, res) => {
  const { sponsorId, impressions, clicks, date } = req.body;
  const { error } = await supabase
    .from('sponsor_metrics')
    .insert([{ sponsor_id: sponsorId, impressions, clicks, recorded_at: date || new Date() }]);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

// Generic webhook for roster changes (e.g., from a signing platform)
router.post('/roster-update', async (req, res) => {
  const { playerId, teamId, action } = req.body; // action: 'add', 'remove'
  if (action === 'add') {
    const { error } = await supabase
      .from('team_players')
      .insert([{ player_id: playerId, team_id: teamId }]);
    if (error) return res.status(500).json({ error });
  } else if (action === 'remove') {
    const { error } = await supabase
      .from('team_players')
      .delete()
      .eq('player_id', playerId)
      .eq('team_id', teamId);
    if (error) return res.status(500).json({ error });
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }
  res.json({ success: true });
});

module.exports = router;
