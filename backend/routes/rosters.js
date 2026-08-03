// rosters.js – factory function
module.exports = (supabase) => {
  const router = require('express').Router();

  // GET all players (with role 'player' or 'coach')
  router.get('/', async (req, res) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role, created_at')
      .in('role', ['player', 'coach']);
    if (error) return res.status(500).json({ error });
    res.json(data);
  });

  // GET a single player with contract info
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, contracts(*)')
      .eq('id', id)
      .single();
    if (error) return res.status(500).json({ error });
    res.json(data);
  });

  // POST – add a new player (admin only – protect with middleware later)
  router.post('/', async (req, res) => {
    const { full_name, username, role, avatar_url } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ full_name, username, role, avatar_url }])
      .select();
    if (error) return res.status(500).json({ error });
    res.status(201).json(data);
  });

  // PUT – update contract details (salary, end_date, substitute)
  router.put('/:id/contract', async (req, res) => {
    const { id } = req.params;
    const { salary, end_date, substitute } = req.body;
    const { data, error } = await supabase
      .from('contracts')
      .upsert({ player_id: id, salary, end_date, substitute })
      .select();
    if (error) return res.status(500).json({ error });
    res.json(data);
  });

  // DELETE – demote a player to 'fan' (soft delete)
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'fan' })
      .eq('id', id);
    if (error) return res.status(500).json({ error });
    res.json({ success: true });
  });

  return router;
};
