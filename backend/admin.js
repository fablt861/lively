const express = require('express');
const { getSettings, updateSettings } = require('./settings');
const { getGlobalStats, getDailyStats, logNewModel } = require('./stats');
const { generateInvoice } = require('./invoice_generator');
const fs = require('fs');
const path = require('path');

const router = express.Router();

module.exports = (io) => {
    const { getRedisClient } = require('./redis');
    const redis = getRedisClient();
    const QUEUE_MODELS = 'queue:models';
    const QUEUE_USERS = 'queue:users';
    const BLOCKLIST_KEYWORDS = 'admin:blocklist:keywords';

    // Initialize blocklist if empty
    (async () => {
        const count = await redis.scard(BLOCKLIST_KEYWORDS);
        if (count === 0) {
            await redis.sadd(BLOCKLIST_KEYWORDS, 'paypal');
            console.log('[Admin] Blocking keyword initialized: paypal');
        }
    })();

// Minimal mock authentication for demonstration
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const MOCK_TOKEN = 'secret-admin-token-xyz';

// Admin Ping (Connectivity Check)
router.get('/ping', (req, res) => {
    res.json({ success: true, timestamp: Date.now() });
});

router.get('/ping', (req, res) => {
    res.json({ success: true, timestamp: Date.now() });
});

const requireAuth = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token && req.query.token) {
        token = `Bearer ${req.query.token}`;
    }

    if (token === `Bearer ${MOCK_TOKEN}`) {
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

// Marketing Analytics
router.get('/marketing', requireAuth, async (req, res) => {
    try {
        const type = req.query.type || 'user';
        const { getMarketingStats } = require('./stats');
        const stats = await getMarketingStats(type);
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.get('/finances', requireAuth, async (req, res) => {
    try {
        const { getFinancialStats } = require('./stats');
        const stats = await getFinancialStats();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/finances/marketing-expense', requireAuth, async (req, res) => {
    try {
        const { month, amount } = req.body;
        if (!month) return res.status(400).json({ error: 'Missing month' });
        
        const { saveMarketingExpense } = require('./stats');
        await saveMarketingExpense(month, parseFloat(amount || '0'));
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Public Tracking Endpoint
router.post('/stats/track-visit', async (req, res) => {
    try {
        const { src, camp, ad, type } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { trackMarketingVisit } = require('./stats');
        await trackMarketingVisit(type || 'user', src, camp, ad, ip);
        res.json({ success: true });
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
        if (updated.maintenanceMode) {
            io.emit('maintenance_active');
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});
// Admin Blocklist (Chat Moderation)
router.get('/blocklist', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const keywords = await redis.smembers(BLOCKLIST_KEYWORDS);
        res.json(keywords);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/blocklist', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const { action, keyword } = req.body;

        if (!keyword) return res.status(400).json({ error: 'Missing keyword' });

        if (action === 'add') {
            await redis.sadd(BLOCKLIST_KEYWORDS, keyword.toLowerCase().trim());
        } else if (action === 'remove') {
            await redis.srem(BLOCKLIST_KEYWORDS, keyword.toLowerCase().trim());
        }

        const keywords = await redis.smembers(BLOCKLIST_KEYWORDS);
        res.json(keywords);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});


// Admin Model Validations
router.get('/elite/pending', requireAuth, async (req, res) => {
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
                    credits: parseFloat(credits),
                    isBuyer: parseFloat(totalSpent) > 0 || parseFloat(credits) > 5,
                    status: u.status || 'active'
                });
            }
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/users/:email/credits', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        const { credits } = req.body;
        if (credits === undefined || credits < 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });
        await redis.set(`user:${email.toLowerCase()}:credits`, credits.toString());
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/users/:email/toggle-status', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        const userData = await redis.get(`user:active:${email}`);
        if (!userData) return res.status(404).json({ error: 'admin.error.user_not_found' });

        const user = JSON.parse(userData);
        user.status = user.status === 'disabled' ? 'active' : 'disabled';
        await redis.set(`user:active:${email}`, JSON.stringify(user));
        res.json({ success: true, status: user.status });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Models List
router.get('/elite', requireAuth, async (req, res) => {
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
                    pseudo: m.pseudo || m.name || m.firstName,
                    phone: m.phone,
                    registeredAt: m.registeredAt,
                    lastLogin,
                    balance: parseFloat(balance),
                    totalGains: parseFloat(totalGains),
                    totalPayouts: parseFloat(totalPayouts),
                    status: m.status || 'active'
                });
            }
        }
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:email/payout', requireAuth, async (req, res) => {
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

router.post('/elite/:email/validate', requireAuth, async (req, res) => {
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
        
        // Track marketing validation
        const { trackModelValidation } = require('./stats');
        const { src, camp, ad } = model.marketing || {};
        await trackModelValidation(src, camp, ad);

        // Real Email Notification via Brevo
        const { sendWelcomeEmail } = require('./mail');
        await sendWelcomeEmail(email, model.pseudo || model.firstName, model.lang || 'en', {
            FIRSTNAME: model.firstName,
            LASTNAME: model.lastName,
            COUNTRY: model.country,
            SMS: model.phone,
            PSEUDO: model.pseudo
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:email/reject', requireAuth, async (req, res) => {
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

router.post('/elite/:email/reset-balance', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email;
        const { amount } = req.body;
        if (amount === undefined || amount < 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });
        await redis.set(`model:${email.toLowerCase()}:balance`, amount.toString());
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

// Admin Payout History List
router.get('/payouts/history', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const keys = await redis.keys('payout:history:*');
        const list = [];
        for (const key of keys) {
            const data = await redis.get(key);
            if (data) list.push(JSON.parse(data));
        }
        // Sort by processed date desc
        list.sort((a, b) => (b.processedAt || 0) - (a.processedAt || 0));
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

        // Fetch billing info for the invoice
        const billingData = await redis.get(`model:${payout.modelEmail}:billing_info`);
        const billingInfo = billingData ? JSON.parse(billingData) : {};

        // GENERATE INVOICE - Essential step
        try {
            const invoiceFile = await generateInvoice(payout, billingInfo);
            if (!invoiceFile) throw new Error('Invoice file name is empty');
            payout.invoiceFile = invoiceFile;
        } catch (pdfErr) {
            console.error('[Invoice Generation Critical Error]', pdfErr);
            return res.status(500).json({ error: 'Failed to generate invoice PDF. Payout not processed.' });
        }

        // Only move to history if invoice succeeded
        await redis.hdel('payouts:pending', id);
        await redis.set(`payout:history:${id}`, JSON.stringify(payout));
        await redis.incrbyfloat(`model:${payout.modelEmail}:total_payouts`, payout.amount);

        res.json({ success: true, invoiceFile: payout.invoiceFile });
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

// Admin Download Invoice
router.get('/payouts/invoice/:id', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const id = req.params.id;
        
        const data = await redis.get(`payout:history:${id}`);
        if (!data) return res.status(404).send('Invoice not found');
        
        const payout = JSON.parse(data);
        if (!payout.invoiceFile) return res.status(404).send('Invoice file not generated');
        
        const filePath = path.join('/tmp/lively_invoices', payout.invoiceFile);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File missing on server');
        }
    } catch (err) {
        res.status(500).send('Error downloading invoice');
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
                modelsCount: queueDetails.models.length,
                usersCount: queueDetails.users.length,
                details: queueDetails
            },
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('[Realtime Stats Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:email/toggle-status', requireAuth, async (req, res) => {
    try {
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        const modelData = await redis.get(`model:active:${email}`);
        if (!modelData) return res.status(404).json({ error: 'admin.error.model_not_found' });

        const model = JSON.parse(modelData);
        model.status = model.status === 'disabled' ? 'active' : 'disabled';
        await redis.set(`model:active:${email}`, JSON.stringify(model));
        res.json({ success: true, status: model.status });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

    return router;
};
