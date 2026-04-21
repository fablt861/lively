const express = require('express');
const { getRedisClient } = require('./redis');
const { query } = require('./db');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Middleware to authenticate model using UUID-based tokens
const requireModelAuth = async (req, res, next) => {
    let auth = req.headers.authorization;
    if (!auth && req.query.token) {
        auth = `Bearer ${req.query.token}`;
    }

    if (auth && auth.startsWith('Bearer model-token-')) {
        req.modelId = auth.replace('Bearer model-token-', '');
        next();
    } else {
        res.status(401).json({ error: 'model.error.unauthorized' });
    }
};

// GET Billing Info
router.get('/:id/billing', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT billing_info FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        res.json(modelRes.rows[0].billing_info || {});
    } catch (err) {
        console.error('[Get Billing Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Save Billing Info
router.post('/:id/billing', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const billingInfo = req.body;
        await query('UPDATE models SET billing_info = $1 WHERE id = $2', [JSON.stringify(billingInfo), id]);
        
        // Sync to Redis for temporary high-speed access
        const redis = getRedisClient();
        await redis.set(`model:${id}:billing_info`, JSON.stringify(billingInfo));
        
        res.json({ success: true });
    } catch (err) {
        console.error('[Save Billing Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Request Payout
router.post('/:id/payout-request', requireModelAuth, async (req, res) => {
    const crypto = require('crypto');
    try {
        const redis = getRedisClient();
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        // Balance is kept in Redis for real-time consistency
        const balance = parseFloat(await redis.get(`model:${id}:balance`) || '0');
        
        const modelRes = await query('SELECT billing_info FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        const billingInfo = modelRes.rows[0].billing_info;

        if (balance < 100) {
            return res.status(400).json({ error: 'payout.error.insufficient_balance' });
        }

        if (!billingInfo || Object.keys(billingInfo).length === 0) {
            return res.status(400).json({ error: 'payout.error.missing_billing_info' });
        }

        const payoutId = crypto.randomUUID();

        // Start transaction in SQL for atomic update
        await query('BEGIN');
        try {
            const modelEmailRes = await query('SELECT email FROM models WHERE id = $1', [id]);
            const email = modelEmailRes.rows[0].email;

            await query(`
                INSERT INTO payouts (id, model_id, model_email, amount, status, created_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `, [payoutId, id, email, balance, 'pending']);
            
            // Deduct in Redis (Real-time source)
            await redis.set(`model:${id}:balance`, '0');
            await redis.incrbyfloat(`model:${id}:total_payout_requested`, balance);
            
            // Sync balance in SQL (Audit trail)
            await query('UPDATE models SET balance = 0, total_payouts = total_payouts + $1 WHERE id = $2', [balance, id]);
            
            await query('COMMIT');
            res.json({ success: true, payoutId });
        } catch (txErr) {
            await query('ROLLBACK');
            throw txErr;
        }
    } catch (err) {
        console.error('[Payout Request Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Profile Info
router.get('/:id/profile', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT * FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });

        const model = modelRes.rows[0];
        const profile = {
            id: model.id,
            email: model.email,
            pseudo: model.pseudo,
            firstName: model.first_name,
            lastName: model.last_name,
            phone: model.phone,
            country: model.country,
            photoProfile: model.photo_profile,
            lang: model.lang,
            status: model.status,
            balance: parseFloat(model.balance),
            registeredAt: model.registered_at,
            totpEnabled: model.totp_enabled || false
        };
        
        res.json(profile);
    } catch (err) {
        console.error('[Get Profile Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT Update Profile Info
router.put('/:id/profile', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const { email: newEmailRaw, phone, pseudo, photoProfile, oldPassword, newPassword, confirmPassword } = req.body;
        const newEmail = newEmailRaw?.toLowerCase();

        const modelRes = await query('SELECT * FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });

        let model = modelRes.rows[0];

        // Handle Password Change
        if (newPassword || oldPassword) {
            if (newPassword && !oldPassword) {
                return res.status(400).json({ error: 'profile.error.password_required' });
            }
            if (oldPassword && model.password !== oldPassword) {
                return res.status(400).json({ error: 'profile.error.password_incorrect' });
            }
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ error: 'profile.error.password_match' });
                }
                model.password = newPassword;
            }
        }

        // Handle Email Change
        if (newEmail && newEmail !== model.email) {
            const checkUser = await query('SELECT email FROM users WHERE email = $1', [newEmail]);
            const checkModel = await query('SELECT email FROM models WHERE email = $1', [newEmail]);
            if (checkUser.rows.length > 0 || checkModel.rows.length > 0) {
                return res.status(400).json({ error: 'auth.error.email_in_use' });
            }
            model.email = newEmail;
        }

        // Update SQL
        await query(`
            UPDATE models SET 
                email = $1, password = $2, phone = $3, pseudo = $4, photo_profile = $5
            WHERE id = $6
        `, [
            model.email, model.password, 
            phone !== undefined ? phone : model.phone, 
            pseudo !== undefined ? pseudo : model.pseudo, 
            photoProfile !== undefined ? photoProfile : model.photo_profile,
            id
        ]);

        res.json({ success: true, user: { id: model.id, email: model.email, name: pseudo || model.pseudo, role: 'model' } });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Payout History
router.get('/:id/payouts', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const modelEmailRes = await query('SELECT email FROM models WHERE id = $1', [id]);
        const email = modelEmailRes.rows[0].email;

        const payoutRes = await query('SELECT * FROM payouts WHERE model_email = $1 ORDER BY created_at DESC', [email]);
        res.json(payoutRes.rows.map(p => ({
            id: p.id,
            modelEmail: p.model_email,
            amount: parseFloat(p.amount),
            status: p.status,
            invoiceNumber: p.invoice_number,
            invoiceFile: p.invoice_file,
            createdAt: p.created_at,
            processedAt: p.processed_at
        })));
    } catch (err) {
        console.error('[Get Payouts Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Model Download Invoice
router.get('/:id/payouts/:payoutId/invoice', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const payoutId = req.params.payoutId;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const modelEmailRes = await query('SELECT email FROM models WHERE id = $1', [id]);
        const email = modelEmailRes.rows[0].email;

        const payoutRes = await query('SELECT * FROM payouts WHERE id = $1 AND model_email = $2', [payoutId, email]);
        if (payoutRes.rows.length === 0) return res.status(404).send('Invoice not found');
        
        const payout = payoutRes.rows[0];
        if (!payout.invoice_file) return res.status(404).send('Invoice file not generated');
        
        const filePath = path.join('/tmp/lively_invoices', payout.invoice_file);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File missing on server');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error downloading invoice');
    }
});

// GET Geoblock Info
router.get('/:id/geoblock', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT blocked_countries FROM models WHERE id = $1', [id]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        res.json({ blockedCountries: modelRes.rows[0].blocked_countries || [] });
    } catch (err) {
        console.error('[Get Geoblock Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Update Geoblock Info
router.post('/:id/geoblock', requireModelAuth, async (req, res) => {
    try {
        const id = req.params.id;
        if (id !== req.modelId) return res.status(403).json({ error: 'Forbidden' });

        const { blockedCountries } = req.body;
        if (!Array.isArray(blockedCountries) || blockedCountries.length > 3) {
            return res.status(400).json({ error: 'geoblock.error.invalid_limit' });
        }

        await query('UPDATE models SET blocked_countries = $1 WHERE id = $2', [JSON.stringify(blockedCountries), id]);
        res.json({ success: true });
    } catch (err) {
        console.error('[Update Geoblock Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

