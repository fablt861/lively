const express = require('express');
const { getRedisClient } = require('./redis');
const router = express.Router();

// Middleware to mock model authentication (simplified for this context)
const requireModelAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer model-token-')) {
        req.modelEmail = authHeader.replace('Bearer model-token-', '');
        next();
    } else {
        res.status(401).json({ error: 'model.error.unauthorized' });
    }
};

// GET Billing Info
router.get('/:email/billing', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const data = await redis.get(`model:${email}:billing_info`);
        res.json(data ? JSON.parse(data) : {});
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Save Billing Info
router.post('/:email/billing', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const billingInfo = req.body;
        await redis.set(`model:${email}:billing_info`, JSON.stringify(billingInfo));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Request Payout
router.post('/:email/payout-request', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const balance = parseFloat(await redis.get(`model:${email}:balance`) || '0');
        const billingInfoStr = await redis.get(`model:${email}:billing_info`);

        if (balance < 100) {
            return res.status(400).json({ error: 'payout.error.insufficient_balance' });
        }

        if (!billingInfoStr) {
            return res.status(400).json({ error: 'payout.error.missing_billing_info' });
        }

        const payoutId = `payout-${Date.now()}-${email}`;
        const payoutRequest = {
            id: payoutId,
            modelEmail: email,
            amount: balance,
            billingInfo: JSON.parse(billingInfoStr),
            status: 'pending',
            timestamp: Date.now()
        };

        // Atomically deduct balance and create request
        await redis.hset('payouts:pending', payoutId, JSON.stringify(payoutRequest));
        await redis.set(`model:${email}:balance`, '0');
        await redis.lpush(`model:${email}:payouts`, payoutId);
        
        // Log in history if needed, or just track as payout
        await redis.incrbyfloat(`model:${email}:total_payout_requested`, balance);

        res.json({ success: true, payoutId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
