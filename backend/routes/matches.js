// matches.js – factory function
module.exports = (supabase) => {
  const router = require('express').Router();

  // GET all matches
  router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('matches').select('*');
    if (error) return res.status(500).json({ error });
    res.json(data);
  });

  // POST – create a new match
  router.post('/', async (req, res) => {
    const { home_team_id, away_team_id, start_time } = req.body;
    const { data, error } = await supabase
      .from('matches')
      .insert({ home_team_id, away_team_id, start_time })
      .select();
    if (error) return res.status(500).json({ error });
    res.status(201).json(data);
  });

  // PUT – update match result (score/status)
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { home_score, away_score, status, time_elapsed } = req.body;
    const { data, error } = await supabase
      .from('matches')
      .update({ home_score, away_score, status, time_elapsed })
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error });
    res.json(data);
  });

  // DELETE – remove a match
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    res.json({ success: true });
  });

  return router;
};
