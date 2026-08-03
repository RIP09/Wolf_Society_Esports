const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET all players with their contracts
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, role, created_at')
    .in('role', ['player', 'coach']);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET a single player's contract details (extended info)
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

// POST – add a new player/coach (admin only – protect with middleware)
router.post('/', async (req, res) => {
  const { full_name, username, email, role, avatar_url } = req.body;
  // Note: This assumes the user already exists in auth.users.
  // For production, you'd invite users via Supabase Auth.
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ full_name, username, role, avatar_url }])
    .select();
  if (error) return res.status(500).json({ error });
  res.status(201).json(data);
});

// PUT – update contract info (end date, salary, etc.)
// We use a separate 'contracts' table (add to schema if needed)
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

// DELETE – release a player (admin only)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'fan' }) // demote to fan, not delete
    .eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

module.exports = router;
