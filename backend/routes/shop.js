// ============================================================
// SHOP ROUTES – Products & Orders
// ============================================================

const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const auth = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET ALL SHOP ITEMS ──────────────────────────────────────
router.get('/items', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET FEATURED SHOP ITEMS ──────────────────────────────────
router.get('/items/featured', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE SHOP ITEM ────────────────────────────────────
router.get('/items/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('shop_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Item not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── CREATE SHOP ITEM (Admin only) ──────────────────────────
router.post('/items', auth, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { name, description, price, category, image_url, stock, featured } = req.body;

        if (!name || price === undefined || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const { data, error } = await supabase
            .from('shop_items')
            .insert([{
                name,
                description,
                price,
                category,
                image_url,
                stock: stock || 0,
                featured: featured || false
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE SHOP ITEM ────────────────────────────────────────
router.put('/items/:id', auth, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.created_at;

        const { data, error } = await supabase
            .from('shop_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Item not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── DELETE SHOP ITEM ────────────────────────────────────────
router.delete('/items/:id', auth, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { id } = req.params;
        const { error } = await supabase
            .from('shop_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// ─── CREATE ORDER ─────────────────────────────────────────────
router.post('/orders', auth, async (req, res, next) => {
    try {
        const { items, total, shipping_address, payment_id } = req.body;

        if (!items || !total) {
            return res.status(400).json({ error: 'Items and total are required' });
        }

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                user_id: req.user.id,
                items,
                total,
                shipping_address,
                payment_id,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET USER ORDERS ──────────────────────────────────────────
router.get('/orders', auth, async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        let query = supabase.from('orders').select('*');

        if (!isAdmin) {
            query = query.eq('user_id', req.user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── GET SINGLE ORDER ─────────────────────────────────────────
router.get('/orders/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Order not found' });
            }
            throw error;
        }

        // Check authorization
        if (data.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - Not your order' });
        }

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── UPDATE ORDER STATUS (Admin only) ────────────────────────
router.patch('/orders/:id/status', auth, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - Admin only' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Order not found' });
            }
            throw error;
        }
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ─── SUBSCRIBE TO NEWSLETTER ──────────────────────────────────
router.post('/subscribe', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { data, error } = await supabase
            .from('subscribers')
            .insert([{ email }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Already subscribed' });
            }
            throw error;
        }
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        next(err);
    }
});

// ─── CONTACT FORM ─────────────────────────────────────────────
router.post('/contact', async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        const { data, error } = await supabase
            .from('contacts')
            .insert([{ name, email, subject, message }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
