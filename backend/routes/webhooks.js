// backend/routes/webhooks.js
module.exports = (supabase) => {
    const router = require('express').Router();

    // Webhook: match result from external API
    router.post('/match-result', async (req, res) => {
        try {
            const { matchId, homeScore, awayScore, status, timeElapsed } = req.body;

            if (!matchId || homeScore === undefined || awayScore === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const { error } = await supabase
                .from('matches')
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    status: status || 'finished',
                    time_elapsed: timeElapsed || null
                })
                .eq('id', matchId);

            if (error) throw error;
            res.json({ success: true, matchId });
        } catch (err) {
            console.error('Webhook error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // Webhook: sponsor metrics
    router.post('/sponsor-impression', async (req, res) => {
        try {
            const { sponsorId, impressions, clicks, date } = req.body;

            if (!sponsorId) {
                return res.status(400).json({ error: 'Missing sponsorId' });
            }

            const { error } = await supabase
                .from('sponsor_metrics')
                .insert([{
                    sponsor_id: sponsorId,
                    impressions: impressions || 0,
                    clicks: clicks || 0,
                    recorded_at: date || new Date().toISOString()
                }]);

            if (error) throw error;
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Webhook: roster update
    router.post('/roster-update', async (req, res) => {
        try {
            const { playerId, teamId, action } = req.body;

            if (!playerId || !teamId || !action) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (action === 'add') {
                const { error } = await supabase
                    .from('team_players')
                    .insert([{ player_id: playerId, team_id: teamId }]);

                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase
                    .from('team_players')
                    .delete()
                    .eq('player_id', playerId)
                    .eq('team_id', teamId);

                if (error) throw error;
            } else {
                return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
            }

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
