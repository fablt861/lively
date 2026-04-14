const express = require('express');
const router = express.Router();
const { query } = require('./db');

// Add to favorites
router.post('/add', async (req, res) => {
    const { userEmail, modelEmail } = req.body;
    if (!userEmail || !modelEmail) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        await query(
            'INSERT INTO favorites (user_email, model_email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userEmail, modelEmail]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Favorites Add]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Remove from favorites
router.post('/remove', async (req, res) => {
    const { userEmail, modelEmail } = req.body;
    if (!userEmail || !modelEmail) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        await query(
            'DELETE FROM favorites WHERE user_email = $1 AND model_email = $2',
            [userEmail, modelEmail]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Favorites Remove]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Check if a model is a favorite
router.get('/check', async (req, res) => {
    const { userEmail, modelEmail } = req.query;
    if (!userEmail || !modelEmail) {
        return res.status(400).json({ error: 'api.error.missing_params' });
    }

    try {
        const result = await query(
            'SELECT 1 FROM favorites WHERE user_email = $1 AND model_email = $2',
            [userEmail, modelEmail]
        );
        res.json({ isFavorite: result.rows.length > 0 });
    } catch (err) {
        console.error('[Favorites Check]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// List all favorite models for a user
router.get('/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const result = await query(
            `SELECT m.email, m.pseudo, m.photo_profile 
             FROM favorites f
             JOIN models m ON f.model_email = m.email
             WHERE f.user_email = $1
             ORDER BY f.created_at DESC`,
            [email]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Favorites List]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

module.exports = router;
