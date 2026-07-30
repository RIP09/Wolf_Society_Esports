// ============================================================
// TEAMS ROUTES – Full CRUD
// ============================================================

const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET ALL TEAMS ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE TEAM ──────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('teams')
            .select('*, players(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── CREATE TEAM (Admin only) ────────────────────────────────
router.post('/', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { name, tag, game, logo_url, description } = req.body;
        if (!name || !tag || !game) {
            return res.status(400).json({ error: 'Name, tag, and game are required' });
        }

        const { data, error } = await supabase
            .from('teams')
            .insert([{ name, tag, game, logo_url, description }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE TEAM ──────────────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;

        const { data, error } = await supabase
            .from('teams')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE TEAM ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { id } = req.params;
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Team deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
