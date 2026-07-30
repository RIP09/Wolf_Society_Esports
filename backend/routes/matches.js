// ============================================================
// MATCHES ROUTES – Full CRUD
// ============================================================

const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET ALL MATCHES ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*, teams(name, tag)')
            .order('match_date', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET UPCOMING MATCHES ─────────────────────────────────────
router.get('/upcoming', async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('matches')
            .select('*, teams(name, tag)')
            .eq('result', 'upcoming')
            .gte('match_date', today)
            .order('match_date', { ascending: true })
            .limit(10);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE MATCH ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('matches')
            .select('*, teams(name, tag)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Match not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── CREATE MATCH ─────────────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { team_id, opponent, game, match_date, time, result, score, maps, vod_url, notes } = req.body;

        if (!team_id || !opponent || !game || !match_date) {
            return res.status(400).json({ error: 'Team, opponent, game, and match date are required' });
        }

        const { data, error } = await supabase
            .from('matches')
            .insert([{
                team_id,
                opponent,
                game,
                match_date,
                time,
                result: result || 'upcoming',
                score,
                maps: maps || [],
                vod_url,
                notes
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE MATCH ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;

        const { data, error } = await supabase
            .from('matches')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Match not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE MATCH ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Match deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
