// ============================================================
// ANNOUNCEMENTS ROUTES – Full CRUD
// ============================================================

const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET ALL ANNOUNCEMENTS ────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*, users(full_name)')
            .order('pinned', { ascending: false })
            .order('published_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET PUBLISHED ANNOUNCEMENTS ─────────────────────────────
router.get('/published', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*, users(full_name)')
            .eq('published', true)
            .order('pinned', { ascending: false })
            .order('published_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE ANNOUNCEMENT ──────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('announcements')
            .select('*, users(full_name)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── CREATE ANNOUNCEMENT ──────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { title, content, category, image_url, pinned, published } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert([{
                title,
                content,
                author_id: req.user.id,
                category: category || 'news',
                image_url,
                pinned: pinned || false,
                published: published !== undefined ? published : true
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE ANNOUNCEMENT ──────────────────────────────────────
router.put('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;
        delete updates.author_id;

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE ANNOUNCEMENT ──────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// ─── TOGGLE PUBLISH STATUS ────────────────────────────────────
router.patch('/:id/toggle-publish', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const { data: current, error: findError } = await supabase
            .from('announcements')
            .select('published')
            .eq('id', id)
            .single();

        if (findError) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const { data, error } = await supabase
            .from('announcements')
            .update({ published: !current.published })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── TOGGLE PIN STATUS ────────────────────────────────────────
router.patch('/:id/toggle-pin', auth, async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin/Manager only' });
        }

        const { id } = req.params;
        const { data: current, error: findError } = await supabase
            .from('announcements')
            .select('pinned')
            .eq('id', id)
            .single();

        if (findError) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const { data, error } = await supabase
            .from('announcements')
            .update({ pinned: !current.pinned })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
