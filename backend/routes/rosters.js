// backend/routes/rosters.js
module.exports = (supabase) => {
    const router = require('express').Router();

    // GET all players
    router.get('/', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, role, created_at')
                .in('role', ['player', 'coach']);

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET player with contract
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('profiles')
                .select('*, contracts(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Player not found' });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST – add player
    router.post('/', async (req, res) => {
        try {
            const { full_name, username, role, avatar_url } = req.body;
            if (!full_name || !username) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const { data, error } = await supabase
                .from('profiles')
                .insert([{ full_name, username, role: role || 'player', avatar_url }])
                .select();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT – update contract
    router.put('/:id/contract', async (req, res) => {
        try {
            const { id } = req.params;
            const { salary, end_date, substitute } = req.body;

            const { data, error } = await supabase
                .from('contracts')
                .upsert({ player_id: id, salary, end_date, substitute })
                .select();

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE – demote to fan
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'fan' })
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
