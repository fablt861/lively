const express = require('express');
const { getRedisClient } = require('./redis');
const crypto = require('crypto');

const router = express.Router();

const MOCK_TOKEN = 'secret-admin-token-xyz';

const requireAdminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${MOCK_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'admin.error.unauthorized' });
    }
};

// Submit a report
router.post('/', async (req, res) => {
    try {
        const redis = getRedisClient();
        console.log('[Report Request Body]', { ...req.body, screenshots: req.body.screenshots?.length + ' items' });
        const { reporterEmail, reportedEmail, reason, screenshots, roomId, reporterRole, reportedRole, reporterName, reportedName } = req.body;

        if (!reportedEmail || !reason) {
            console.warn('[Report Error] Missing fields:', { reportedEmail, reason });
            return res.status(400).json({ error: 'report.error.missing_fields' });
        }

        const reportId = `report:${Date.now()}:${crypto.randomBytes(4).toString('hex')}`;
        const report = {
            id: reportId,
            reporterEmail,
            reportedEmail,
            reporterRole,
            reportedRole,
            reporterName: reporterName || reporterEmail?.split('@')[0] || 'Guest',
            reportedName: reportedName || reportedEmail?.split('@')[0] || 'Unknown',
            reason,
            screenshots, // Array of 3 base64 strings
            roomId,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        await redis.set(reportId, JSON.stringify(report));
        await redis.lpush('reports:list', reportId);

        res.json({ success: true, reportId });
    } catch (err) {
        console.error('[Report Submission Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin: List reports
router.get('/admin/list', requireAdminAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const reportIds = await redis.lrange('reports:list', 0, -1);
        const reports = [];

        for (const id of reportIds) {
            const data = await redis.get(id);
            if (data) {
                reports.push(JSON.parse(data));
            }
        }

        res.json(reports);
    } catch (err) {
        console.error('[Admin List Reports Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin: Ban user and close report
router.post('/admin/:id/ban', requireAdminAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const reportId = req.params.id;
        const reportData = await redis.get(reportId);
        if (!reportData) return res.status(404).json({ error: 'api.error.not_found' });

        const report = JSON.parse(reportData);
        const email = report.reportedEmail;
        const role = report.reportedRole;

        // 1. Mark account as banned
        if (role === 'model') {
            const modelData = await redis.get(`model:active:${email}`);
            if (modelData) {
                const model = JSON.parse(modelData);
                model.status = 'banned';
                await redis.set(`model:active:${email}`, JSON.stringify(model));
            }
        } else {
            const userData = await redis.get(`user:active:${email}`);
            if (userData) {
                const user = JSON.parse(userData);
                user.status = 'banned';
                await redis.set(`user:active:${email}`, JSON.stringify(user));
            }
        }

        // 2. Set persistent ban flag
        await redis.set(`ban:${email}`, 'true');

        // 3. Mark report as closed
        report.status = 'resolved_banned';
        await redis.set(reportId, JSON.stringify(report));

        res.json({ success: true });
    } catch (err) {
        console.error('[Admin Ban Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// Admin: Dismiss report
router.post('/admin/:id/dismiss', requireAdminAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const reportId = req.params.id;
        const reportData = await redis.get(reportId);
        if (!reportData) return res.status(404).json({ error: 'api.error.not_found' });

        const report = JSON.parse(reportData);
        report.status = 'dismissed';
        await redis.set(reportId, JSON.stringify(report));

        res.json({ success: true });
    } catch (err) {
        console.error('[Admin Dismiss Report Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

module.exports = router;
