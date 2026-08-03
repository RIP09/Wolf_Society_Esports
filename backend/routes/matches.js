const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('matches').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { home_team_id, away_team_id, start_time } = req.body;
  const { data, error } = await supabase.from('matches').insert({ home_team_id, away_team_id, start_time });
  if (error) return res.status(500).json({ error });
  res.status(201).json(data);
});

module.exports = router;
