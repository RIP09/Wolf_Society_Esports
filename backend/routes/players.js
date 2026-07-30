// ============================================================
// PLAYERS ROUTES – Full CRUD
// ============================================================

const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET ALL PLAYERS ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*, users(full_name, email), teams(name, tag)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE PLAYER ────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('players')
            .select('*, users(full_name, email), teams(name, tag)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── CREATE PLAYER ────────────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { user_id, team_id, display_name, avatar_url, game, role, status, stats, social_links } = req.body;

        if (!display_name) {
            return res.status(400).json({ error: 'Display name is required' });
        }

        const { data, error } = await supabase
            .from('players')
            .insert([{
                user_id,
                team_id,
                display_name,
                avatar_url,
                game,
                role,
                status,
                stats: stats || {},
                social_links: social_links || {}
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE PLAYER ────────────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;

        // Check if user is allowed to update
        const { data: existing, error: findError } = await supabase
            .from('players')
            .select('user_id')
            .eq('id', id)
            .single();

        if (findError) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const isAdmin = ['admin', 'manager'].includes(req.user.role);
        const isOwner = existing && existing.user_id === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Forbidden - Not authorized' });
        }

        // If not admin, restrict what can be updated
        if (!isAdmin) {
            const allowed = ['display_name', 'avatar_url', 'bio'];
            Object.keys(updates).forEach(key => {
                if (!allowed.includes(key)) {
                    delete updates[key];
                }
            });
        }

        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE PLAYER ────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Player deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
