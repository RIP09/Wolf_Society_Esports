// backend/routes/matches.js
module.exports = (supabase) => {
  const router = require('express').Router();

  // GET all matches
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .order('start_time', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET a single match by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Match not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST – create a new match
  router.post('/', async (req, res) => {
    try {
      const { home_team_id, away_team_id, start_time, status } = req.body;
      if (!home_team_id || !away_team_id) {
        return res.status(400).json({ error: 'Missing team IDs' });
      }
      const { data, error } = await supabase
        .from('matches')
        .insert({
          home_team_id,
          away_team_id,
          start_time: start_time || new Date().toISOString(),
          status: status || 'scheduled'
        })
        .select();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT – update match
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { home_score, away_score, status, time_elapsed, start_time } = req.body;
      const updates = {};
      if (home_score !== undefined) updates.home_score = home_score;
      if (away_score !== undefined) updates.away_score = away_score;
      if (status) updates.status = status;
      if (time_elapsed) updates.time_elapsed = time_elapsed;
      if (start_time) updates.start_time = start_time;

      const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Match not found' });
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE – remove a match
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
