// webhooks.js – factory function
module.exports = (supabase) => {
  const router = require('express').Router();

  // Webhook: match result from external API
  router.post('/match-result', async (req, res) => {
    const { matchId, homeScore, awayScore, status, timeElapsed } = req.body;
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

  // Webhook: sponsor impression metrics
  router.post('/sponsor-impression', async (req, res) => {
    const { sponsorId, impressions, clicks, date } = req.body;
    const { error } = await supabase
      .from('sponsor_metrics')
      .insert([{ sponsor_id: sponsorId, impressions, clicks, recorded_at: date || new Date() }]);
    if (error) return res.status(500).json({ error });
    res.json({ success: true });
  });

  // Webhook: roster update (add/remove player from team)
  router.post('/roster-update', async (req, res) => {
    const { playerId, teamId, action } = req.body;
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

  return router;
};
