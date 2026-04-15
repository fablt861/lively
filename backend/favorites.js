const express = require('express');
const router = express.Router();
const { query } = require('./db');
const { getRedisClient } = require('./redis');
const redis = getRedisClient();

// Add to favorites
router.post('/add', async (req, res) => {
    const { userId, modelId } = req.body;
    if (!userId || !modelId) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        await query(
            'INSERT INTO favorites (user_id, model_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, modelId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Favorites Add]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Remove from favorites
router.post('/remove', async (req, res) => {
    const { userId, modelId } = req.body;
    if (!userId || !modelId) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        await query(
            'DELETE FROM favorites WHERE user_id = $1 AND model_id = $2',
            [userId, modelId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Favorites Remove]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Check if a model is a favorite
router.get('/check', async (req, res) => {
    const { userId, modelId } = req.query;
    if (!userId || !modelId) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        const result = await query(
            'SELECT 1 FROM favorites WHERE user_id = $1 AND model_id = $2',
            [userId, modelId]
        );
        res.json({ isFavorite: result.rows.length > 0 });
    } catch (err) {
        console.error('[Favorites Check]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// List all favorite models for a user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await query(
            `SELECT m.id, m.pseudo, m.photo_profile 
             FROM favorites f
             JOIN models m ON f.model_id = m.id
             WHERE f.user_id = $1
             ORDER BY f.created_at DESC`,
            [userId]
        );

        // Check online status and busy status for each model
        const models = await Promise.all(result.rows.map(async (model) => {
            const isOnline = await redis.sismember('online_models', model.id);
            const activeRoom = await redis.get(`user_active_room:${model.id}`);
            return {
                ...model,
                isOnline: isOnline === 1,
                isBusy: !!activeRoom
            };
        }));

        res.json(models);
    } catch (err) {
        console.error('[Favorites List]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

module.exports = router;
