const express = require('express');
const { getRedisClient } = require('./redis');
const { logNewUser } = require('./stats');
const crypto = require('crypto');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const redis = getRedisClient();

    // 1. Try Model
    const modelData = await redis.get(`model:active:${email}`);
    if (modelData) {
        const model = JSON.parse(modelData);
        if (model.password === password) {
            // Update last login
            await redis.set(`user:${email}:last_login`, new Date().toISOString());
            return res.json({
                success: true,
                token: `model-token-${email}`,
                user: { email, role: 'model', name: model.name }
            });
        }
    }

    // 2. Try User
    const userData = await redis.get(`user:active:${email}`);
    if (userData) {
        const user = JSON.parse(userData);
        if (user.password === password) {
            // Update last login
            await redis.set(`user:${email}:last_login`, new Date().toISOString());
            return res.json({
                success: true,
                token: `user-token-${email}`,
                user: { email, role: 'user', name: user.name || user.pseudo }
            });
        }
    }

    // fallback for old mock logic if needed, but better to be strict
    return res.status(401).json({ error: 'auth.error.invalid_credentials' });
});

router.post('/register', async (req, res) => {
    const { email, password, pseudo } = req.body;
    const redis = getRedisClient();

    if (!email || !password || !pseudo) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    const existingUser = await redis.get(`user:active:${email}`);
    const existingModel = await redis.get(`model:active:${email}`);
    if (existingUser || existingModel) {
        return res.status(400).json({ error: 'auth.error.email_in_use' });
    }

    const newUser = {
        id: crypto.randomUUID(),
        email,
        password, // In production, hash it
        pseudo,
        role: 'user',
        registeredAt: new Date().toISOString()
    };

    await redis.set(`user:active:${email}`, JSON.stringify(newUser));
    // Grant 5 free credits (30 seconds) for new accounts
    await redis.set(`user:${email}:credits`, "5");
    await logNewUser();

    res.json({
        success: true,
        token: `user-token-${email}`,
        user: { email, role: 'user', name: pseudo }
    });
});

router.post('/model/register', async (req, res) => {
    const redis = getRedisClient();
    const { country, phone, name, dob, email, password, photo3Fingers, photo5Fingers } = req.body;

    if (!email || !password || !photo3Fingers) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    const existing = await redis.get(`model:active:${email}`);
    if (existing) {
        return res.status(400).json({ error: 'auth.error.email_already_registered' });
    }

    const existingPending = await redis.get(`model:pending:${email}`);
    if (existingPending) {
        return res.status(400).json({ error: 'auth.error.request_pending' });
    }

    const payload = {
        id: crypto.randomUUID(),
        email,
        password,
        name,
        dob,
        country,
        phone,
        photo3Fingers,
        photo5Fingers,
        registeredAt: new Date().toISOString()
    };

    await redis.set(`model:pending:${email}`, JSON.stringify(payload));
    res.json({ success: true, message: 'auth.success.registration_submitted' });
});

module.exports = router;
