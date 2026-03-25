const express = require('express');
const { getRedisClient } = require('./redis');
const crypto = require('crypto');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    const redis = getRedisClient();

    if (role === 'model') {
        const data = await redis.get(`model:active:${email}`);
        if (data) {
            const model = JSON.parse(data);
            if (model.password === password) {
                return res.json({ success: true, token: `model-token-${email}`, user: { email, role: 'model', name: model.name } });
            }
        }
        return res.status(401).json({ error: 'Identifiants invalides ou compte en attente de validation.' });
    } else {
        // Mock User Login (Just accept it for now as a guest that signed up)
        return res.json({ success: true, token: `user-token-${email}`, user: { email, role: 'user' } });
    }
});

router.post('/model/register', async (req, res) => {
    const redis = getRedisClient();
    const { country, phone, name, dob, email, password, photo3Fingers, photo5Fingers } = req.body;

    if (!email || !password || !photo3Fingers) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await redis.get(`model:active:${email}`);
    if (existing) {
        return res.status(400).json({ error: 'Email déjà enregistré.' });
    }

    const existingPending = await redis.get(`model:pending:${email}`);
    if (existingPending) {
        return res.status(400).json({ error: 'Une demande est déjà en attente pour cet email.' });
    }

    const payload = {
        id: crypto.randomUUID(),
        email,
        password, // In production, must be hashed
        name,
        dob,
        country,
        phone,
        photo3Fingers,
        photo5Fingers,
        registeredAt: new Date().toISOString()
    };

    await redis.set(`model:pending:${email}`, JSON.stringify(payload));
    res.json({ success: true, message: 'Inscription soumise pour révision.' });
});

module.exports = router;
