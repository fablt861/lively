const express = require('express');
const { getSettings, updateSettings } = require('./settings');
const { getGlobalStats, getDailyStats, logNewModel } = require('./stats');
const { generateInvoice } = require('./invoice_generator');
const { query } = require('./db');
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
        try {
            const count = await redis.scard(BLOCKLIST_KEYWORDS);
            if (count === 0) {
                await redis.sadd(BLOCKLIST_KEYWORDS, 'paypal');
                console.log('[Admin] Blocking keyword initialized: paypal');
            }
        } catch (err) {
            console.error('[Admin] Failed to initialize blocklist:', err.message);
        }
    })();

// Minimal authentication
const ADMIN_USER = process.env.ADMIN_USER || 'kinky-operator';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Knm?74Mgm4oycNBk';
const MOCK_TOKEN = process.env.ADMIN_TOKEN_SECRET || 'secret-admin-token-xyz';

// Admin Ping (Connectivity Check)
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

// Admin Teaser Full Stats & Management
router.get('/teaser/stats', requireAuth, async (req, res) => {
    try {
        const teaserDir = path.join(__dirname, '../frontend/public/videos/teaser');
        const disabled = await redis.smembers('admin:teaser:disabled');
        
        let videos = [];
        if (fs.existsSync(teaserDir)) {
            const files = fs.readdirSync(teaserDir);
            videos = files.filter(f => f.endsWith('.mp4')).map(f => ({
                id: f,
                name: f,
                path: `/videos/teaser/${f}`,
                active: !disabled.includes(f)
            }));
        }

        // Add stats for each video + "none" (control group)
        const allKeys = [...videos.map(v => v.id), 'none'];
        const stats = await Promise.all(allKeys.map(async (id) => {
            const views = await redis.get(`teaser:stats:${id}:views`) || 0;
            const conversions = await redis.get(`teaser:stats:${id}:conversions`) || 0;
            return { id, views: parseInt(views), conversions: parseInt(conversions) };
        }));

        res.json({
            videos: videos.map(v => ({
                ...v,
                stats: stats.find(s => s.id === v.id),
                active: !disabled.includes(v.id)
            })),
            control: {
                ...stats.find(s => s.id === 'none'),
                active: !disabled.includes('none')
            }
        });
    } catch (err) {
        console.error('[Teaser Stats Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/teaser/toggle', requireAuth, async (req, res) => {
    try {
        const { id, active } = req.body;
        if (active) {
            await redis.srem('admin:teaser:disabled', id);
        } else {
            await redis.sadd('admin:teaser:disabled', id);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/teaser/log-view', async (req, res) => {
    try {
        const { id, userId } = req.body; // id is filename or 'none'
        if (!id) return res.status(400).send('Missing teaser ID');
        
        await redis.incr(`teaser:stats:${id}:views`);
        if (userId) {
            await redis.set(`user:${userId}:last_teaser`, id, 'EX', 86400 * 7); // Store for 7 days
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Teaser List (For Frontend selection)
router.get('/teaser/list', async (req, res) => {
    try {
        const teaserDir = path.join(__dirname, '../frontend/public/videos/teaser');
        if (!fs.existsSync(teaserDir)) {
            return res.json(['none']);
        }
        const disabled = await redis.smembers('admin:teaser:disabled');
        const files = fs.readdirSync(teaserDir);
        const videos = files.filter(f => f.endsWith('.mp4') && !disabled.includes(f)).map(f => `/videos/teaser/${f}`);
        
        // Return videos + "none" to represent the control group (only if not disabled)
        if (!disabled.includes('none')) {
            videos.push('none');
        }
        res.json(videos);
    } catch (err) {
        console.error('[Teaser List Error]', err);
        res.json(['none']);
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

// Admin Blocklist
router.get('/blocklist', requireAuth, async (req, res) => {
    try {
        const keywords = await redis.smembers(BLOCKLIST_KEYWORDS);
        res.json(keywords);
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/blocklist', requireAuth, async (req, res) => {
    try {
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


// Admin Model Validations (Pending)
router.get('/elite/pending', requireAuth, async (req, res) => {
    try {
        const modelRes = await query('SELECT * FROM models WHERE status = $1 ORDER BY registered_at DESC', ['pending']);
        // Map to expected frontend format
        const models = modelRes.rows.map(m => ({
            id: m.id,
            email: m.email,
            firstName: m.first_name,
            lastName: m.last_name,
            pseudo: m.pseudo,
            dob: m.dob,
            country: m.country,
            phone: m.phone,
            photoProfile: m.photo_profile,
            photoId: m.photo_id,
            photoIdSelfie: m.photo_id_selfie,
            registeredAt: m.registered_at,
            marketing: { src: m.marketing_src, camp: m.marketing_camp, ad: m.marketing_ad }
        }));
        res.json(models);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Users List (With Pagination)
router.get('/users', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let usersParams = [limit, offset];
        let countParams = [];
        let whereClause = '';

        if (search) {
            whereClause = ' WHERE email ILIKE $1 OR pseudo ILIKE $1';
            countParams = [`%${search}%`];
            usersParams = [`%${search}%`, limit, offset];
        }

        const countRes = await query(`SELECT COUNT(*) FROM users ${whereClause}`, countParams);
        const total = parseInt(countRes.rows[0].count);

        const userRes = await query(`
            SELECT * FROM users 
            ${whereClause}
            ORDER BY registered_at DESC 
            LIMIT ${search ? '$2 OFFSET $3' : '$1 OFFSET $2'}
        `, usersParams);

        const users = await Promise.all(userRes.rows.map(async u => {
            const redisCredits = await redis.get(`user:${u.id}:credits`);
            const credits = redisCredits !== null ? parseFloat(redisCredits) : parseFloat(u.credits);
            
            return {
                id: u.id,
                email: u.email,
                pseudo: u.pseudo,
                registeredAt: u.registered_at,
                lastLogin: u.last_login || u.registered_at,
                totalSpent: parseFloat(u.total_spent),
                credits: credits,
                isBuyer: parseFloat(u.total_spent) > 0 || credits > 5,
                status: u.status,
                marketing: { src: u.marketing_src, camp: u.marketing_camp, ad: u.marketing_ad }
            };
        }));

        res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/users/:id/credits', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { credits } = req.body;
        if (credits === undefined || credits < 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });
        
        await query('UPDATE users SET credits = $1 WHERE id = $2', [credits, id]);
        await redis.set(`user:${id}:credits`, credits.toString());
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/users/:id/toggle-status', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const userRes = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'admin.error.user_not_found' });

        const currentStatus = userRes.rows[0].status;
        const newStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
        
        await query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, id]);
        res.json({ success: true, status: newStatus });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Models List (With Pagination)
router.get('/elite', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let modelsParams = ['pending', limit, offset];
        let countParams = ['pending'];
        let searchClause = '';

        if (search) {
            searchClause = ' AND (email ILIKE $2 OR pseudo ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2)';
            countParams = ['pending', `%${search}%`];
            modelsParams = ['pending', `%${search}%`, limit, offset];
        }

        const countRes = await query(`SELECT COUNT(*) FROM models WHERE status != $1 ${searchClause}`, countParams);
        const total = parseInt(countRes.rows[0].count);

        const modelRes = await query(`
            SELECT * FROM models 
            WHERE status != $1 ${searchClause}
            ORDER BY registered_at DESC 
            LIMIT ${search ? '$3 OFFSET $4' : '$2 OFFSET $3'}
        `, modelsParams);

        const models = await Promise.all(modelRes.rows.map(async m => {
            const redisBalance = await redis.get(`model:${m.id}:balance`);
            const balance = redisBalance !== null ? parseFloat(redisBalance) : parseFloat(m.balance);

            return {
                id: m.id,
                email: m.email,
                pseudo: m.pseudo || m.first_name,
                phone: m.phone,
                registeredAt: m.registered_at,
                lastLogin: m.last_login || m.registered_at,
                balance: balance,
                totalGains: parseFloat(m.total_gains),
                totalPayouts: parseFloat(m.total_payouts),
                status: m.status,
                totpEnabled: m.totp_enabled || false,
                marketing: { src: m.marketing_src, camp: m.marketing_camp, ad: m.marketing_ad },
                photoProfile: m.photo_profile,
                photoProfileReg: m.photo_profile_reg || m.photo_profile,
                photoId: m.photo_id,
                photoIdSelfie: m.photo_id_selfie
            };
        }));

        res.json({ models, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:id/payout', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });

        const modelRes = await query('SELECT email FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'api.error.not_found' });
        const email = modelRes.rows[0].email.toLowerCase();

        const balance = parseFloat(await redis.get(`model:${id}:balance`) || '0');
        if (amount > balance) return res.status(400).json({ error: 'admin.error.insufficient_balance' });

        await redis.incrbyfloat(`model:${id}:balance`, -amount);
        await query('UPDATE models SET balance = balance - $1, total_payouts = total_payouts + $1 WHERE id = $2', [amount, id]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:id/validate', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const modelRes = await query('SELECT * FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'api.error.not_found' });

        const model = modelRes.rows[0];
        const email = model.email.toLowerCase();
        await query('UPDATE models SET status = $1, validated_at = CURRENT_TIMESTAMP WHERE id = $2', ['active', id]);
        
        await logNewModel();
        
        // Track marketing validation
        const { trackModelValidation } = require('./stats');
        await trackModelValidation(model.marketing_src, model.marketing_camp, model.marketing_ad);

        // Real Email Notification
        const { sendWelcomeEmail } = require('./mail');
        await sendWelcomeEmail(email, model.pseudo || model.first_name, model.lang || 'en', {
            FIRSTNAME: model.first_name,
            LASTNAME: model.last_name,
            COUNTRY: model.country,
            SMS: model.phone,
            PSEUDO: model.pseudo
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:id/reject', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        await query('DELETE FROM models WHERE id = $1 AND status = $2', [id, 'pending']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:id/reset-balance', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { amount } = req.body;
        if (amount === undefined || amount < 0) return res.status(400).json({ error: 'admin.error.invalid_amount' });
        
        await query('UPDATE models SET balance = $1 WHERE id = $2', [amount, id]);
        await redis.set(`model:${id}:balance`, amount.toString());
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/:id/disable-2fa', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        await query('UPDATE models SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payouts Summary (Aggregated by method, respecting Saturday 23:59:59 Paris cut-off)
router.get('/payouts/summary', requireAuth, async (req, res) => {
    try {
        // Calculate the most recent Saturday cut-off
        const now = new Date();
        const day = now.getDay(); // 0 is Sunday, 6 is Saturday
        const daysSinceSat = (day + 1) % 7;
        const lastSaturday = new Date(now);
        lastSaturday.setDate(now.getDate() - daysSinceSat);
        lastSaturday.setHours(23, 59, 59, 999);

        const readyRes = await query(`
            SELECT 
                payment_method as method, 
                COUNT(*) as count, 
                SUM(amount) as total
            FROM payouts 
            WHERE status = 'pending' AND created_at <= $1
            GROUP BY payment_method
        `, [lastSaturday]);
        
        const ongoingRes = await query(`
            SELECT 
                payment_method as method, 
                COUNT(*) as count, 
                SUM(amount) as total
            FROM payouts 
            WHERE status = 'pending' AND created_at > $1
            GROUP BY payment_method
        `, [lastSaturday]);
        
        const ready = {
            bank: { count: 0, total: 0 },
            paxum: { count: 0, total: 0 },
            crypto: { count: 0, total: 0 }
        };

        const ongoing = {
            bank: { count: 0, total: 0 },
            paxum: { count: 0, total: 0 },
            crypto: { count: 0, total: 0 }
        };

        readyRes.rows.forEach(row => {
            if (ready[row.method]) {
                ready[row.method] = {
                    count: parseInt(row.count),
                    total: parseFloat(row.total)
                };
            }
        });

        ongoingRes.rows.forEach(row => {
            if (ongoing[row.method]) {
                ongoing[row.method] = {
                    count: parseInt(row.count),
                    total: parseFloat(row.total)
                };
            }
        });

        res.json({ 
            ready, 
            ongoing,
            cutoff: lastSaturday.toISOString(),
            isPastCutoff: true 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payouts List (Pending)
router.get('/payouts/pending', requireAuth, async (req, res) => {
    try {
        // We show all pending payouts, but perhaps we should mark those after cut-off
        const payoutRes = await query('SELECT * FROM payouts WHERE status = $1 ORDER BY created_at DESC', ['pending']);
        
        // Compatibility with frontend format (prefers snapshot if available)
        const list = payoutRes.rows.map(p => ({
            id: p.id,
            modelId: p.model_id,
            modelEmail: p.model_email,
            amount: parseFloat(p.amount),
            status: p.status,
            method: p.payment_method,
            billingInfo: p.billing_snapshot || {},
            createdAt: p.created_at
        }));

        for (let i = 0; i < list.length; i++) {
            if (!list[i].billingInfo || Object.keys(list[i].billingInfo).length === 0) {
                const modelRes = await query('SELECT billing_info FROM models WHERE id = $1', [list[i].modelId]);
                list[i].billingInfo = modelRes.rows[0]?.billing_info || {};
                list[i].method = list[i].method || list[i].billingInfo.method;
            }
        }

        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payout History List
router.get('/payouts/history', requireAuth, async (req, res) => {
    try {
        const payoutRes = await query('SELECT * FROM payouts WHERE status != $1 ORDER BY processed_at DESC NULLS LAST, created_at DESC', ['pending']);
        res.json(payoutRes.rows.map(p => ({
            id: p.id,
            modelEmail: p.model_email,
            amount: parseFloat(p.amount),
            status: p.status,
            invoiceNumber: p.invoice_number,
            invoiceFile: p.invoice_file,
            processedAt: p.processed_at,
            createdAt: p.created_at
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin Payout History Weekly (Grouped by Saturday cutoff)
router.get('/payouts/history/weekly', requireAuth, async (req, res) => {
    try {
        const historyRes = await query(`
            WITH week_data AS (
                SELECT 
                    id, amount, payment_method, processed_at,
                    (DATE_TRUNC('week', created_at + interval '1 day') - interval '1 day' + interval '23 hours 59 minutes 59 seconds') as week_ending
                FROM payouts
                WHERE status = 'paid'
            )
            SELECT 
                week_ending,
                payment_method as method,
                SUM(amount) as total,
                COUNT(*) as count
            FROM week_data
            GROUP BY week_ending, payment_method
            ORDER BY week_ending DESC
        `);
        
        const weeks = {};
        historyRes.rows.forEach(row => {
            const date = new Date(row.week_ending).toISOString().split('T')[0];
            if (!weeks[date]) weeks[date] = { date, bank: { total: 0, count: 0 }, paxum: { total: 0, count: 0 }, crypto: { total: 0, count: 0 } };
            if (weeks[date][row.method]) {
                weeks[date][row.method] = { total: parseFloat(row.total), count: parseInt(row.count) };
            }
        });

        res.json(Object.values(weeks));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Payout History Months (For ZIP view)
router.get('/payouts/history/months', requireAuth, async (req, res) => {
    try {
        const monthsRes = await query(`
            SELECT DISTINCT TO_CHAR(processed_at, 'YYYY-MM') as month, COUNT(*) as count
            FROM payouts
            WHERE status = 'paid'
            GROUP BY month
            ORDER BY month DESC
        `);
        res.json(monthsRes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// CORE LOGIC: Approve Single Payout
const approveSinglePayout = async (payoutId, settings, redis, query, generateInvoice) => {
    const payoutRes = await query('SELECT * FROM payouts WHERE id = $1', [payoutId]);
    if (payoutRes.rows.length === 0) throw new Error('Payout not found');
    const payout = payoutRes.rows[0];
    
    // Fetch snapshot or billing info
    const modelRes = await query('SELECT billing_info FROM models WHERE id = $1', [payout.model_id]);
    const billingInfo = payout.billing_snapshot || modelRes.rows[0]?.billing_info || {};

    // Get/Generate Model Numeric ID
    let modelNumericId = await redis.get(`model:${payout.model_id}:numeric_id`);
    if (!modelNumericId) {
        const nextId = await redis.incr('models:global_id_counter');
        modelNumericId = `M${String(nextId).padStart(3, '0')}`;
        await redis.set(`model:${payout.model_id}:numeric_id`, modelNumericId);
    }

    // Generate Invoice Number
    const invoiceSeq = await redis.incr('invoices:global_sequence');
    const year = new Date().getFullYear();
    const invoiceNumber = `PAY-${year}-${modelNumericId}-${String(invoiceSeq).padStart(3, '0')}`;

    const payoutCompat = {
        id: payout.id,
        modelEmail: payout.model_email.toLowerCase(),
        amount: parseFloat(payout.amount),
        transferFee: parseFloat(settings.payoutFeeUsd || 5.0),
        invoiceNumber,
        processedAt: new Date()
    };

    // GENERATE PDF
    const invoiceFile = await generateInvoice(payoutCompat, billingInfo);
    if (!invoiceFile) throw new Error('Invoice file generation failed');

    // Update SQL
    await query(`
        UPDATE payouts SET 
            status = 'paid', 
            processed_at = CURRENT_TIMESTAMP, 
            invoice_number = $1, 
            invoice_file = $2
        WHERE id = $3
    `, [invoiceNumber, invoiceFile, payoutId]);

    return { id: payoutId, invoiceNumber, invoiceFile };
};

// Admin Payout Approve (Individual)
router.post('/payouts/:id/approve', requireAuth, async (req, res) => {
    try {
        const { getSettings } = require('./settings');
        const settings = await getSettings();
        const result = await approveSinglePayout(req.params.id, settings, redis, query, generateInvoice);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Batch Payout Approve
router.post('/payouts/batch-approve', requireAuth, async (req, res) => {
    const { method, cutoff } = req.body;
    if (!method || !cutoff) return res.status(400).json({ error: 'Missing method or cutoff' });

    try {
        const payoutsToApprove = await query(
            "SELECT id FROM payouts WHERE status = 'pending' AND payment_method = $1 AND created_at <= $2",
            [method, cutoff]
        );

        if (payoutsToApprove.rows.length === 0) {
            return res.status(404).json({ error: 'No pending payouts found.' });
        }

        const { getSettings } = require('./settings');
        const settings = await getSettings();
        const results = { success: 0, failed: 0, errors: [] };

        for (const p of payoutsToApprove.rows) {
            try {
                await approveSinglePayout(p.id, settings, redis, query, generateInvoice);
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({ id: p.id, error: err.message });
            }
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Admin Bulk Invoice ZIP Download
router.get('/payouts/invoices/bulk', requireAuth, async (req, res) => {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ error: 'Month is required' });

    try {
        const archiver = require('archiver');
        const fs = require('fs');
        const path = require('path');
        const invoicesDir = '/tmp/lively_invoices';

        const payoutRes = await query(`
            SELECT * FROM payouts 
            WHERE status = 'paid' AND TO_CHAR(processed_at, 'YYYY-MM') = $1
        `, [month]);

        if (payoutRes.rows.length === 0) {
            return res.status(404).json({ error: 'No invoices found for this month.' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`invoices_${month}.zip`);
        archive.pipe(res);

        const { getSettings } = require('./settings');
        const settings = await getSettings();

        for (const p of payoutRes.rows) {
            let filePath = path.join(invoicesDir, p.invoice_file);
            
            // Regenerate if missing
            if (!fs.existsSync(filePath)) {
                try {
                    const modelRes = await query('SELECT billing_info FROM models WHERE id = $1', [p.model_id]);
                    const billingInfo = p.billing_snapshot || modelRes.rows[0]?.billing_info || {};
                    const payoutCompat = {
                        id: p.id,
                        modelEmail: p.model_email,
                        amount: parseFloat(p.amount),
                        transferFee: parseFloat(settings.payoutFeeUsd || 5.0),
                        invoiceNumber: p.invoice_number,
                        processedAt: p.processed_at
                    };
                    await generateInvoice(payoutCompat, billingInfo);
                } catch (err) {
                    console.error(`Failed to regenerate invoice ${p.id}:`, err);
                    continue;
                }
            }
            
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: p.invoice_file });
            }
        }

        archive.finalize();
    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

// Admin Maintenance: Reset Database
router.post('/maintenance/reset', requireAuth, async (req, res) => {
    try {
        const { initSettings } = require('./settings');
        console.log('[Maintenance] Hybrid database reset requested.');

        await redis.flushall();
        await initSettings();
        
        // Reset SQL Tables (CAUTION)
        await query('TRUNCATE TABLE payouts, users, models RESTART IDENTITY CASCADE');

        res.json({ success: true, message: 'admin.success.db_reset' });
    } catch (err) {
        console.error('[Maintenance Error]', err);
        res.status(500).json({ error: 'admin.error.db_reset_failed' });
    }
});

router.post('/maintenance/sync-pseudos', requireAuth, async (req, res) => {
    try {
        console.log('[Maintenance] Manual pseudo synchronization requested.');
        const sqlRes = await query(`
            SELECT id, email, pseudo, NULL as first_name, NULL as last_name, 'user' as role FROM users
            UNION
            SELECT id, email, pseudo, first_name, last_name, 'model' as role FROM models
        `);
        
        let updated = 0;
        for (const account of sqlRes.rows) {
            const id = account.id;
            
            // 1. Sync Pseudos
            const pseudo = account.pseudo || (account.first_name ? `${account.first_name} ${account.last_name || ''}`.trim() : null) || account.email.split('@')[0];
            await redis.hset(`profile:${id}`, 'pseudo', pseudo);
            
            // 2. Sync Balances / Credits
            if (account.role === 'user') {
                const creditsRes = await query(`SELECT credits FROM users WHERE id = $1`, [id]);
                const credits = creditsRes.rows[0]?.credits || 0;
                await redis.set(`user:${id}:credits`, credits);
            } else {
                const balanceRes = await query(`SELECT balance FROM models WHERE id = $1`, [id]);
                const balance = balanceRes.rows[0]?.balance || 0;
                await redis.set(`model:${id}:balance`, balance);
            }

            updated++;
        }
        res.json({ success: true, updated, message: 'Full synchronization complete: Pseudos, Credits, and Balances.' });
    } catch (err) {
        console.error('[Maintenance Error] Pseudo Sync failed', err);
        res.status(500).json({ error: 'admin.error.sync_failed' });
    }
});

router.post('/maintenance/reconstruct-stats', requireAuth, async (req, res) => {
    const { getRedisClient } = require('./redis');
    const redis = getRedisClient();
    
    try {
        console.log('[Maintenance] Starting full stats reconstruction...');
        
        // 1. Reconstruct User Stats & Marketing
        const userStats = await query(`
            SELECT 
                registered_at::date as date, 
                marketing_src, marketing_camp, marketing_ad, 
                COUNT(*) as count 
            FROM users 
            GROUP BY registered_at::date, marketing_src, marketing_camp, marketing_ad
        `);
        
        for (const row of userStats.rows) {
            const dateStr = row.date.toISOString().split('T')[0];
            const src = row.marketing_src || '';
            const camp = row.marketing_camp || '';
            const ad = row.marketing_ad || '';
            const key = (src || camp || ad) ? `src:${src}|camp:${camp}|ad:${ad}` : 'direct';
            
            // Daily stats
            await redis.hincrby(`stats:${dateStr}`, 'new_users', parseInt(row.count));
            
            // Marketing stats
            await redis.hincrby(`marketing:users:stats:${key}`, 'signups', parseInt(row.count));
            await redis.sadd('marketing:users:active_keys', key);
        }

        // 2. Reconstruct Model Stats & Marketing
        const modelStats = await query(`
            SELECT 
                registered_at::date as date, 
                marketing_src, marketing_camp, marketing_ad, 
                COUNT(*) as count 
            FROM models 
            GROUP BY registered_at::date, marketing_src, marketing_camp, marketing_ad
        `);
        
        for (const row of modelStats.rows) {
            const dateStr = row.date.toISOString().split('T')[0];
            const src = row.marketing_src || '';
            const camp = row.marketing_camp || '';
            const ad = row.marketing_ad || '';
            const key = (src || camp || ad) ? `src:${src}|camp:${camp}|ad:${ad}` : 'direct';
            
            // Daily stats
            await redis.hincrby(`stats:${dateStr}`, 'new_models', parseInt(row.count));
            
            // Marketing stats
            await redis.hincrby(`marketing:models:stats:${key}`, 'signups', parseInt(row.count));
            await redis.sadd('marketing:models:active_keys', key);
        }

        // 3. Reconstruct Payout Stats
        const payoutStats = await query(`
            SELECT created_at::date as date, SUM(amount) as total 
            FROM payouts 
            WHERE status = 'paid'
            GROUP BY created_at::date
        `);
        
        for (const row of payoutStats.rows) {
            const dateStr = row.date.toISOString().split('T')[0];
            await redis.hincrbyfloat(`stats:${dateStr}`, 'model_payout_usd', parseFloat(row.total));
        }

        console.log('[Maintenance] Stats reconstruction completed successfully.');
        res.json({ success: true, message: 'Reconstruction completed for Signups, Marketing, and Payouts.' });
    } catch (err) {
        console.error('[Maintenance Error] Stats Reconstruction failed', err);
        res.status(500).json({ error: 'admin.error.reconstruction_failed' });
    }
});

router.post('/maintenance/migrate-redis-uuid', requireAuth, async (req, res) => {
    try {
        console.log('[Maintenance] Starting on-the-fly Redis UUID Migration...');
        let userCount = 0;
        let modelCount = 0;

        // 1. Migrate Users
        const userRes = await query('SELECT id, email FROM users');
        for (const user of userRes.rows) {
            const id = user.id;
            const email = user.email.toLowerCase();
            const mappings = [
                { old: `user:${email}:credits`, new: `user:${id}:credits` },
                { old: `user:${email}:last_login`, new: `user:${id}:last_login` },
                { old: `user:${email}:total_spent`, new: `user:${id}:total_spent` },
                { old: `user:${email}:history`, new: `user:${id}:history` },
                { old: `profile:${email}`, new: `profile:${id}` }
            ];
            for (const map of mappings) {
                if (await redis.exists(map.old) && !(await redis.exists(map.new))) {
                    await redis.rename(map.old, map.new);
                }
            }
            userCount++;
        }

        // 2. Migrate Models
        const modelRes = await query('SELECT id, email FROM models');
        for (const model of modelRes.rows) {
            const id = model.id;
            const email = model.email.toLowerCase();
            const mappings = [
                { old: `model:${email}:balance`, new: `model:${id}:balance` },
                { old: `model:${email}:total_gains`, new: `model:${id}:total_gains` },
                { old: `model:${email}:last_login`, new: `model:${id}:last_login` },
                { old: `model:${email}:numeric_id`, new: `model:${id}:numeric_id` },
                { old: `model:${email}:history`, new: `model:${id}:history` },
                { old: `profile:${email}`, new: `profile:${id}` }
            ];
            for (const map of mappings) {
                if (await redis.exists(map.old) && !(await redis.exists(map.new))) {
                    await redis.rename(map.old, map.new);
                }
            }
            modelCount++;
        }

        res.json({ success: true, userCount, modelCount, message: 'Redis UUID migration completed successfully.' });
    } catch (err) {
        console.error('[Maintenance Error] Redis UUID Migration failed', err);
        res.status(500).json({ error: 'admin.error.migration_failed' });
    }
});

router.get('/realtime', requireAuth, async (req, res) => {
    try {
        const sockets = await io.fetchSockets();
        const modelsOnline = sockets.filter(s => (s.data?.role || s.role) === 'model').length;
        const usersOnline = sockets.filter(s => (s.data?.role || s.role) === 'user').length;
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

        const waitingModelsIds = await redis.lrange(QUEUE_MODELS, 0, -1);
        const waitingUsersIds = await redis.lrange(QUEUE_USERS, 0, -1);
        const queueDetails = { models: [], users: [] };

        for (const id of waitingModelsIds) {
            const s = sockets.find(s => s.id === id);
            if (s) queueDetails.models.push({ id, name: (s.data?.pseudo || s.modelName || 'Model'), email: (s.data?.userEmail || s.userEmail) });
        }
        for (const id of waitingUsersIds) {
            const s = sockets.find(s => s.id === id);
            if (s) queueDetails.users.push({ id, type: (s.data?.userEmail || s.userEmail) ? 'registered' : 'guest', name: (s.data?.pseudo || s.userName || 'Guest'), ip: (s.data?.userIp || s.userIp) });
        }

        res.json({
            online: { totalModels: modelsOnline, totalUsers: usersOnline, activeCalls: activeCallsCount, roomDetails },
            queue: { modelsCount: queueDetails.models.length, usersCount: queueDetails.users.length, details: queueDetails },
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('[Realtime Stats Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

    return router;
};
