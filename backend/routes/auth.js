// ============================================================
// AUTH ROUTES – Login, Register, Me
// ============================================================

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const auth = require('../middleware/auth');

// ─── REGISTER ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, full_name, role } = req.body;

        // Validation
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const { data: existing, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: hashedPassword,
                full_name,
                role: role || 'player'
            }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
});

// ─── LOGIN ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                bio: user.bio
            }
        });
    } catch (err) {
        next(err);
    }
});

// ─── GET CURRENT USER ────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.full_name,
            role: req.user.role,
            avatar_url: req.user.avatar_url,
            bio: req.user.bio
        }
    });
});

// ─── UPDATE PROFILE ───────────────────────────────────────────
router.put('/profile', auth, async (req, res, next) => {
    try {
        const { full_name, avatar_url, bio } = req.body;
        const { data: user, error } = await supabase
            .from('users')
            .update({ full_name, avatar_url, bio })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                bio: user.bio
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
