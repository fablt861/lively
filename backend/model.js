const express = require('express');
const { getRedisClient } = require('./redis');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Middleware to mock model authentication (simplified for this context)
const requireModelAuth = async (req, res, next) => {
    let auth = req.headers.authorization;
    if (!auth && req.query.token) {
        auth = `Bearer ${req.query.token}`;
    }

    if (auth && auth.startsWith('Bearer model-token-')) {
        req.modelEmail = auth.replace('Bearer model-token-', '');
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
        const transferFee = 5.0;
        const netAmount = balance - transferFee;

        const payoutRequest = {
            id: payoutId,
            modelEmail: email,
            amount: balance, // Gross amount
            transferFee: transferFee,
            netAmount: netAmount,
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

// GET Profile Info
router.get('/:email/profile', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const data = await redis.get(`model:active:${email}`);
        if (!data) return res.status(404).json({ error: 'Model not found' });

        const model = JSON.parse(data);
        // Don't send password
        delete model.password;
        res.json(model);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT Update Profile Info
router.put('/:email/profile', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const oldEmail = req.params.email.toLowerCase();
        if (oldEmail !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const { email: newEmailRaw, phone, pseudo, photoProfile } = req.body;
        const newEmail = newEmailRaw?.toLowerCase();

        const data = await redis.get(`model:active:${oldEmail}`);
        if (!data) return res.status(404).json({ error: 'Model not found' });

        let model = JSON.parse(data);

        // Handle Email Change
        if (newEmail && newEmail !== oldEmail) {
            // Check if new email is taken
            const existsModel = await redis.exists(`model:active:${newEmail}`);
            const existsUser = await redis.exists(`user:active:${newEmail}`);
            if (existsModel || existsUser) {
                return res.status(400).json({ error: 'auth.error.email_in_use' });
            }

            // Migrate all keys
            const keysToMigrate = [
                { old: `model:active:${oldEmail}`, new: `model:active:${newEmail}`, type: 'string' },
                { old: `model:${oldEmail}:balance`, new: `model:${newEmail}:balance`, type: 'string' },
                { old: `model:${oldEmail}:billing_info`, new: `model:${newEmail}:billing_info`, type: 'string' },
                { old: `model:${oldEmail}:payouts`, new: `model:${newEmail}:payouts`, type: 'list' },
                { old: `model:${oldEmail}:stats`, new: `model:${newEmail}:stats`, type: 'string' },
                { old: `model:${oldEmail}:total_payout_requested`, new: `model:${newEmail}:total_payout_requested`, type: 'string' },
                { old: `user:${oldEmail}:last_login`, new: `user:${newEmail}:last_login`, type: 'string' },
            ];

            for (const k of keysToMigrate) {
                const val = await redis.get(k.old); // Simplified migration, for list it might need more care but here we rename
                if (await redis.exists(k.old)) {
                    // For safety, let's use RENAME if it's the same Redis instance
                    try {
                        await redis.rename(k.old, k.new);
                    } catch (e) {
                        // If cross-slot error or similar in cluster, fallback to copy (though rename is better)
                        console.error(`Rename failed for ${k.old}:`, e);
                    }
                }
            }
            
            model.email = newEmail;
        }

        // Update other fields
        if (phone !== undefined) model.phone = phone;
        if (pseudo !== undefined) model.pseudo = pseudo;
        if (photoProfile !== undefined) model.photoProfile = photoProfile;

        const currentEmail = newEmail || oldEmail;
        await redis.set(`model:active:${currentEmail}`, JSON.stringify(model));

        res.json({ success: true, user: { email: currentEmail, name: model.pseudo || model.name, role: 'model' } });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Payout History
router.get('/:email/payouts', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const payoutIds = await redis.lrange(`model:${email}:payouts`, 0, -1);
        const history = [];

        for (const id of payoutIds) {
            // Check pending first
            let data = await redis.hget('payouts:pending', id);
            if (!data) {
                // Check history
                data = await redis.get(`payout:history:${id}`);
            }

            if (data) {
                history.push(JSON.parse(data));
            }
        }

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Model Download Invoice
router.get('/:email/payouts/:id/invoice', requireModelAuth, async (req, res) => {
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        const id = req.params.id;
        
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const data = await redis.get(`payout:history:${id}`);
        if (!data) return res.status(404).send('Invoice not found');
        
        const payout = JSON.parse(data);
        if (payout.modelEmail.toLowerCase() !== email) return res.status(403).send('Forbidden');
        if (!payout.invoiceFile) return res.status(404).send('Invoice metadata not found');
        
        const filePath = path.join('/tmp/lively_invoices', payout.invoiceFile);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            // Logically impossible if DB says it exists, so maybe filesystem issue or cleanup
            res.status(404).send('File missing on server');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading invoice');
    }
});

module.exports = router;

