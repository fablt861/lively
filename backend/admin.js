const express = require('express');
const { getSettings, updateSettings } = require('./settings');
const { getGlobalStats, getDailyStats, logNewModel } = require('./stats');

const router = express.Router();

module.exports = (io) => {
    const { getRedisClient } = require('./redis');
    const redis = getRedisClient();
    const QUEUE_MODELS = 'queue:models';
    const QUEUE_USERS = 'queue:users';

// Minimal mock authentication for demonstration
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const MOCK_TOKEN = 'secret-admin-token-xyz';

// Admin Ping (Connectivity Check)
router.get('/ping', (req, res) => {
    res.json({ success: true, timestamp: Date.now() });
});

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${MOCK_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'admin.error.unauthorized' });
    }
};

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ token: MOCK_TOKEN });
    } else {
        res.status(401).json({ error: 'admin.error.invalid_credentials' });
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
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Settings
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/settings', requireAuth, async (req, res) => {
    try {
        const updated = await updateSettings(req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
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
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Users List
router.get('/users', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const keys = await redis.keys('user:active:*');
        const users = [];

        for (const key of keys) {
            const email = key.replace('user:active:', '');
            const data = await redis.get(key);
            if (data) {
                const u = JSON.parse(data);
                const totalSpent = await redis.get(`user:${email}:total_spent`) || '0';
                const lastLogin = await redis.get(`user:${email}:last_login`) || u.registeredAt;
                const credits = await redis.get(`user:${email}:credits`) || '0';

                users.push({
                    email,
                    pseudo: u.pseudo,
                    registeredAt: u.registeredAt,
                    lastLogin,
                    totalSpent: parseFloat(totalSpent),
                    isBuyer: parseFloat(totalSpent) > 0 || parseFloat(credits) > 5 // Mock check: spent or has recharged
                });
            }
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Models List
router.get('/models', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const keys = await redis.keys('model:active:*');
        const models = [];

        for (const key of keys) {
            const email = key.replace('model:active:', '');
            const data = await redis.get(key);
            if (data) {
                const m = JSON.parse(data);
                const balance = await redis.get(`model:${email}:balance`) || '0';
                const totalGains = await redis.get(`model:${email}:total_gains`) || '0';
                const totalPayouts = await redis.get(`model:${email}:total_payouts`) || '0';
                const lastLogin = await redis.get(`user:${email}:last_login`) || m.registeredAt; // Shared key pattern

                models.push({
                    email,
                    pseudo: m.name,
                    phone: m.phone,
                    registeredAt: m.registeredAt,
                    lastLogin,
                    balance: parseFloat(balance),
                    totalGains: parseFloat(totalGains),
                    totalPayouts: parseFloat(totalPayouts)
                });
            }
        }
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/models/:email/payout', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        const { amount } = req.body;

        if (!amount || amount <= 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });

        const balance = parseFloat(await redis.get(`model:${email}:balance`) || '0');
        if (amount > balance) return res.status(400).json({ error: 'admin.error.insufficient_balance' });

        await redis.incrbyfloat(`model:${email}:balance`, -amount);
        await redis.incrbyfloat(`model:${email}:total_payouts`, amount);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/models/:email/validate', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        const data = await redis.get(`model:pending:${email}`);
        if (!data) return res.status(404).json({ error: 'api.error.not_found' });

        const model = JSON.parse(data);
        model.validatedAt = new Date().toISOString();

        await redis.set(`model:active:${email}`, JSON.stringify(model));
        await redis.del(`model:pending:${email}`);
        await logNewModel();

        console.log(`\n[EMAIL MOCK] 📧 -> To: ${email} | Subject: Votre compte est validé ! | Body: Bonjour ${model.name}, vous pouvez désormais vous connecter et commencer vos appels.\n`);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
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
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payouts List
router.get('/payouts/pending', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const payouts = await redis.hgetall('payouts:pending');
        const list = Object.values(payouts).map(p => JSON.parse(p));
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payout Approve (Mark as Paid)
router.post('/payouts/:id/approve', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const id = req.params.id;
        const data = await redis.hget('payouts:pending', id);
        if (!data) return res.status(404).json({ error: 'api.error.not_found' });

        const payout = JSON.parse(data);
        payout.status = 'paid';
        payout.processedAt = Date.now();

        await redis.hdel('payouts:pending', id);
        await redis.set(`payout:history:${id}`, JSON.stringify(payout));
        await redis.incrbyfloat(`model:${payout.modelEmail}:total_payouts`, payout.amount);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payout Reject (Refund to Balance)
router.post('/payouts/:id/reject', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const id = req.params.id;
        const data = await redis.hget('payouts:pending', id);
        if (!data) return res.status(404).json({ error: 'api.error.not_found' });

        const payout = JSON.parse(data);
        payout.status = 'rejected';
        payout.processedAt = Date.now();

        await redis.hdel('payouts:pending', id);
        await redis.set(`payout:history:${id}`, JSON.stringify(payout));
        
        // Refund to model balance
        await redis.incrbyfloat(`model:${payout.modelEmail}:balance`, payout.amount);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Maintenance: Reset Database
router.post('/maintenance/reset', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const { initSettings } = require('./settings');
        const redis = getRedisClient();

        console.log('[Maintenance] Full database reset requested via Admin.');

        await redis.flushall();
        await initSettings();

        // Reset basic counters
        await redis.set('global:total_users', '0');
        await redis.set('global:total_models', '0');
        await redis.set('global:total_clients', '0');

        res.json({ success: true, message: 'admin.success.db_reset' });
    } catch (err) {
        console.error('[Maintenance Error]', err);
        res.status(500).json({ error: 'admin.error.db_reset_failed' });
    }
});

router.get('/realtime', requireAuth, async (req, res) => {
    try {
        const sockets = await io.fetchSockets();
        
        // 1. Basic Stats
        const modelsOnline = sockets.filter(s => s.role === 'model').length;
        const usersOnline = sockets.filter(s => s.role === 'user').length;
        const rooms = await redis.hgetall('billing:active_rooms');
        const activeCallsCount = Object.keys(rooms).length;

        const roomDetails = [];
        for (const roomId in rooms) {
            const data = JSON.parse(rooms[roomId]);
            roomDetails.push({
                roomId,
                userId: data.userId,
                modelId: data.modelId,
                startTime: data.startTime,
                durationSec: Math.floor((Date.now() - data.startTime) / 1000)
            });
        }

        // 2. Queue Status (IDs from Redis)
        const waitingModelsIds = await redis.lrange(QUEUE_MODELS, 0, -1);
        const waitingUsersIds = await redis.lrange(QUEUE_USERS, 0, -1);

        // 3. Detailed Queue Info
        const queueDetails = {
            models: [],
            users: []
        };

        for (const id of waitingModelsIds) {
            const s = sockets.find(s => s.id === id);
            if (s) {
                queueDetails.models.push({
                    id,
                    name: s.modelName || 'Model',
                    email: s.userEmail
                });
            }
        }

        for (const id of waitingUsersIds) {
            const s = sockets.find(s => s.id === id);
            if (s) {
                queueDetails.users.push({
                    id,
                    type: s.userEmail ? 'registered' : 'guest',
                    name: s.userName || (s.userEmail ? s.userEmail.split('@')[0] : 'Guest'),
                    ip: s.userIp
                });
            }
        }

        res.json({
            online: {
                totalModels: modelsOnline,
                totalUsers: usersOnline,
                activeCalls: activeCallsCount,
                roomDetails
            },
            queue: {
                modelsCount: waitingModelsIds.length,
                usersCount: waitingUsersIds.length,
                details: queueDetails
            },
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('[Realtime Stats Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

    return router;
};
