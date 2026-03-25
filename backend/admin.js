const express = require('express');
const { getSettings, updateSettings } = require('./settings');
const { getGlobalStats, getDailyStats } = require('./stats');

const router = express.Router();

// Minimal mock authentication for demonstration
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const MOCK_TOKEN = 'secret-admin-token-xyz';

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${MOCK_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ token: MOCK_TOKEN });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin Stats
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const global = await getGlobalStats();
        const daily = await getDailyStats(7); // Last 7 days
        res.json({ global, daily });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Settings
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/settings', requireAuth, async (req, res) => {
    try {
        const updated = await updateSettings(req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Model Validations
router.get('/models/pending', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const keys = await redis.keys('model:pending:*');
        const models = [];
        for (const key of keys) {
            const data = await redis.get(key);
            if (data) models.push(JSON.parse(data));
        }
        res.json(models);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/models/:email/validate', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        const data = await redis.get(`model:pending:${email}`);
        if (!data) return res.status(404).json({ error: 'Not found' });

        const model = JSON.parse(data);
        model.validatedAt = new Date().toISOString();

        await redis.set(`model:active:${email}`, JSON.stringify(model));
        await redis.del(`model:pending:${email}`);

        console.log(`\n[EMAIL MOCK] 📧 -> To: ${email} | Subject: Votre compte est validé ! | Body: Bonjour ${model.name}, vous pouvez désormais vous connecter et commencer vos appels.\n`);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/models/:email/reject', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        await redis.del(`model:pending:${email}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
