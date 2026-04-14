const express = require('express');
const { getRedisClient } = require('./redis');
const { query } = require('./db');
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
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT billing_info FROM models WHERE email = $1', [email]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        res.json(modelRes.rows[0].billing_info || {});
    } catch (err) {
        console.error('[Get Billing Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Save Billing Info
router.post('/:email/billing', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const billingInfo = req.body;
        await query('UPDATE models SET billing_info = $1 WHERE email = $2', [JSON.stringify(billingInfo), email]);
        
        // Sync to Redis for temporary high-speed access if needed
        const redis = getRedisClient();
        await redis.set(`model:${email}:billing_info`, JSON.stringify(billingInfo));
        
        res.json({ success: true });
    } catch (err) {
        console.error('[Save Billing Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Request Payout
router.post('/:email/payout-request', requireModelAuth, async (req, res) => {
    const crypto = require('crypto');
    try {
        const redis = getRedisClient();
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        // Balance is kept in Redis for real-time consistency
        const balance = parseFloat(await redis.get(`model:${email}:balance`) || '0');
        
        const modelRes = await query('SELECT billing_info FROM models WHERE email = $1', [email]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        const billingInfo = modelRes.rows[0].billing_info;

        if (balance < 100) {
            return res.status(400).json({ error: 'payout.error.insufficient_balance' });
        }

        if (!billingInfo || Object.keys(billingInfo).length === 0) {
            return res.status(400).json({ error: 'payout.error.missing_billing_info' });
        }

        const payoutId = crypto.randomUUID();
        const transferFee = 5.0;

        // Start transaction in SQL for atomic update
        await query('BEGIN');
        try {
            await query(`
                INSERT INTO payouts (id, model_email, amount, status, created_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            `, [payoutId, email, balance, 'pending']);
            
            // Deduct in Redis (Real-time source)
            await redis.set(`model:${email}:balance`, '0');
            await redis.incrbyfloat(`model:${email}:total_payout_requested`, balance);
            
            // Sync balance in SQL (Audit trail)
            await query('UPDATE models SET balance = 0, total_payouts = total_payouts + $1 WHERE email = $2', [balance, email]);
            
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
router.get('/:email/profile', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT * FROM models WHERE email = $1', [email]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });

        const model = modelRes.rows[0];
        // Normalize fields for frontend (map snake_case to camelCase if needed)
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
            registeredAt: model.registered_at
        };
        
        res.json(profile);
    } catch (err) {
        console.error('[Get Profile Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT Update Profile Info
router.put('/:email/profile', requireModelAuth, async (req, res) => {
    try {
        const oldEmail = req.params.email.toLowerCase();
        if (oldEmail !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const { email: newEmailRaw, phone, pseudo, photoProfile, oldPassword, newPassword, confirmPassword } = req.body;
        const newEmail = newEmailRaw?.toLowerCase();

        const modelRes = await query('SELECT * FROM models WHERE email = $1', [oldEmail]);
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
        if (newEmail && newEmail !== oldEmail) {
            const checkUser = await query('SELECT email FROM users WHERE email = $1', [newEmail]);
            const checkModel = await query('SELECT email FROM models WHERE email = $1', [newEmail]);
            if (checkUser.rows.length > 0 || checkModel.rows.length > 0) {
                return res.status(400).json({ error: 'auth.error.email_in_use' });
            }
            // If email changes, it requires a lot of updates in the legacy Redis logic too
            // For now, let's just update SQL and sync keys if necessary
            model.email = newEmail;
        }

        // Update SQL
        await query(`
            UPDATE models SET 
                email = $1, password = $2, phone = $3, pseudo = $4, photo_profile = $5
            WHERE email = $6
        `, [
            model.email, model.password, 
            phone !== undefined ? phone : model.phone, 
            pseudo !== undefined ? pseudo : model.pseudo, 
            photoProfile !== undefined ? photoProfile : model.photo_profile,
            oldEmail
        ]);

        const currentEmail = model.email;
        res.json({ success: true, user: { email: currentEmail, name: pseudo || model.pseudo, role: 'model' } });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Payout History
router.get('/:email/payouts', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

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
router.get('/:email/payouts/:id/invoice', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const id = req.params.id;
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const payoutRes = await query('SELECT * FROM payouts WHERE id = $1 AND model_email = $2', [id, email]);
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
router.get('/:email/geoblock', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const modelRes = await query('SELECT blocked_countries FROM models WHERE email = $1', [email]);
        if (modelRes.rows.length === 0) return res.status(404).json({ error: 'Model not found' });
        
        res.json({ blockedCountries: modelRes.rows[0].blocked_countries || [] });
    } catch (err) {
        console.error('[Get Geoblock Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST Update Geoblock Info
router.post('/:email/geoblock', requireModelAuth, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        if (email !== req.modelEmail.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });

        const { blockedCountries } = req.body;
        if (!Array.isArray(blockedCountries) || blockedCountries.length > 3) {
            return res.status(400).json({ error: 'geoblock.error.invalid_limit' });
        }

        await query('UPDATE models SET blocked_countries = $1 WHERE email = $2', [JSON.stringify(blockedCountries), email]);
        
        // Find active sockets for this model to update their data in real-time
        // We can do this via global io if available, or just rely on re-fetch on join_queue
        // But for consistency, let's assume matching.js will handle the next join_queue
        
        res.json({ success: true });
    } catch (err) {
        console.error('[Update Geoblock Error]', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

