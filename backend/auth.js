const express = require('express');
const { getRedisClient } = require('./redis');
const { query } = require('./db');
const { logNewUser } = require('./stats');
const crypto = require('crypto');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase();
    const redis = getRedisClient();

    try {
        // 1. Try Model
        const modelRes = await query('SELECT * FROM models WHERE email = $1', [email]);
        if (modelRes.rows.length > 0) {
            const model = modelRes.rows[0];
            if (model.status === 'banned' || model.status === 'disabled') {
                return res.status(403).json({ error: 'auth.error.banned' });
            }
            if (model.status === 'pending') {
                return res.status(403).json({ error: 'auth.error.request_pending' });
            }
            if (model.password === password) {
                // Update last login in SQL & Redis (shared key for compatibility)
                const now = new Date().toISOString();
                await query('UPDATE models SET last_login = $1 WHERE id = $2', [now, model.id]);
                await redis.set(`user:${model.id}:last_login`, now);
                await redis.hset(`profile:${model.id}`, 'pseudo', model.pseudo || `${model.first_name} ${model.last_name}`);
                
                return res.json({
                    success: true,
                    token: `model-token-${model.id}`,
                    user: { 
                        id: model.id,
                        email, 
                        role: 'model', 
                        name: model.pseudo || `${model.first_name} ${model.last_name}` 
                    }
                });
            }
        }

        // 2. Try User
        const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            if (user.status === 'banned' || user.status === 'disabled') {
                return res.status(403).json({ error: 'auth.error.banned' });
            }
            if (user.password === password) {
                // Update last login
                const now = new Date().toISOString();
                await query('UPDATE users SET last_login = $1 WHERE id = $2', [now, user.id]);
                await redis.set(`user:${user.id}:last_login`, now);
                await redis.hset(`profile:${user.id}`, 'pseudo', user.pseudo);
                
                return res.json({
                    success: true,
                    token: `user-token-${user.id}`,
                    user: { 
                        id: user.id,
                        email, 
                        role: 'user', 
                        name: user.pseudo, 
                        credits: parseFloat(user.credits) 
                    }
                });
            }
        }

        return res.status(401).json({ error: 'auth.error.invalid_credentials' });
    } catch (err) {
        console.error('[Login Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/register', async (req, res) => {
    const { email: rawEmail, password, pseudo, src, camp, ad } = req.body;
    const email = rawEmail?.toLowerCase();
    const { trackMarketingSignup } = require('./stats');

    if (!email || !password || !pseudo) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    try {
        // Check existence in both tables
        const checkUser = await query('SELECT email FROM users WHERE email = $1', [email]);
        const checkModel = await query('SELECT email FROM models WHERE email = $1', [email]);
        
        if (checkUser.rows.length > 0 || checkModel.rows.length > 0) {
            return res.status(400).json({ error: 'auth.error.email_in_use' });
        }

        const id = crypto.randomUUID();
        await query(`
            INSERT INTO users (
                id, email, password, pseudo, credits, marketing_src, marketing_camp, marketing_ad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [id, email, password, pseudo, 5.00, src, camp, ad]);

        // Sync initial credits to Redis for fast access in billing logic
        const redis = getRedisClient();
        await redis.set(`user:${id}:credits`, "5");
        await redis.hset(`profile:${id}`, 'pseudo', pseudo);
        
        await logNewUser();
        await trackMarketingSignup('user', src, camp, ad);

        res.json({
            success: true,
            token: `user-token-${id}`,
            user: { id, email, role: 'user', name: pseudo, credits: 5 }
        });
    } catch (err) {
        console.error('[Register Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.get('/me', async (req, res) => {
    const { email: rawEmail, id } = req.query;
    const email = rawEmail?.toLowerCase();
    
    try {
        let user, model;

        // 1. Check in users table
        if (id) {
            const userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
            user = userRes.rows[0];
        } else if (email) {
            const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
            user = userRes.rows[0];
        }

        if (user) {
            const redis = getRedisClient();
            const credits = await redis.get(`user:${user.id}:credits`) || user.credits;
            
            return res.json({
                id: user.id,
                email: user.email,
                pseudo: user.pseudo,
                role: 'user',
                credits: parseFloat(credits)
            });
        }

        // 2. Check in models table
        if (id) {
            const modelRes = await query('SELECT * FROM models WHERE id = $1', [id]);
            model = modelRes.rows[0];
        } else if (email) {
            const modelRes = await query('SELECT * FROM models WHERE email = $1', [email]);
            model = modelRes.rows[0];
        }

        if (model) {
            return res.json({
                id: model.id,
                email: model.email,
                pseudo: model.pseudo || `${model.first_name} ${model.last_name}`,
                role: 'model',
                credits: 0
            });
        }

        return res.status(404).json({ error: 'User or model not found' });
    } catch (err) {
        console.error('[Me Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/add-credits', async (req, res) => {
    const { email: rawEmail, id, amount } = req.body;
    const email = rawEmail?.toLowerCase();
    const redis = getRedisClient();

    if ((!email && !id) || !amount) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    try {
        const { priceUsd, userId } = req.body;
        const targetId = id || userId;
        const { trackMarketingRevenue } = require('./stats');

        let userRes;
        if (targetId) {
            userRes = await query('SELECT * FROM users WHERE id = $1', [targetId]);
        } else {
            userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        }

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'auth.error.user_not_found' });
        }

        const user = userRes.rows[0];
        
        // Rapid credit update (Redis is primary for per-second billing)
        let newCredits;
        const currentCredits = parseFloat((await redis.get(`user:${user.id}:credits`)) || '0');
        
        if (currentCredits < 0) {
            newCredits = parseFloat(amount);
            await redis.set(`user:${user.id}:credits`, newCredits.toString());
        } else {
            newCredits = await redis.incrbyfloat(`user:${user.id}:credits`, amount);
        }

        // Persist to SQL (source of truth for long term) - Update by ID (UUID)
        await query('UPDATE users SET credits = $1 WHERE id = $2', [newCredits, user.id]);

        await trackMarketingRevenue(user.marketing_src, user.marketing_camp, user.marketing_ad, priceUsd || parseFloat(amount) / 10, user.id);
        const { logPurchase } = require('./stats');
        await logPurchase(priceUsd || parseFloat(amount) / 10);

        res.json({
            success: true,
            credits: newCredits
        });
    } catch (err) {
        console.error('[Add Credits Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

router.post('/elite/register', async (req, res) => {
    const { country, phone, firstName, lastName, pseudo, dob, email: rawEmail, password, photoProfile, photoId, photoIdSelfie, src, camp, ad } = req.body;
    const email = rawEmail?.toLowerCase();

    if (!email || !password || !firstName || !lastName || !photoProfile || !photoId || !photoIdSelfie) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    try {
        const { trackMarketingSignup } = require('./stats');

        // Check existence
        const checkModel = await query('SELECT email FROM models WHERE email = $1', [email]);
        if (checkModel.rows.length > 0) {
            const m = checkModel.rows[0];
            if (m.status === 'pending') return res.status(400).json({ error: 'auth.error.request_pending' });
            return res.status(400).json({ error: 'auth.error.email_already_registered' });
        }

        const id = crypto.randomUUID();
        await query(`
            INSERT INTO models (
                id, email, password, lang, first_name, last_name, pseudo, dob, country, phone, 
                photo_profile, photo_profile_reg, photo_id, photo_id_selfie, status, marketing_src, 
                marketing_camp, marketing_ad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
            id, email, password, req.body.lang || 'en', firstName, lastName, pseudo, dob, country, phone,
            photoProfile, photoProfile, photoId, photoIdSelfie, 'pending', src, camp, ad
        ]);

        await trackMarketingSignup('model', src, camp, ad);
        res.json({ success: true, message: 'auth.success.registration_submitted' });
    } catch (err) {
        console.error('[Model Register Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

// User Profile Update (Pseudo, Email, Password)
router.put('/profile', async (req, res) => {
    const { currentEmail, pseudo, newEmail, oldPassword, newPassword } = req.body;
    
    if (!currentEmail) return res.status(400).json({ error: 'Missing current email' });

    try {
        // 1. Fetch current user
        const userRes = await query('SELECT * FROM users WHERE email = $1', [currentEmail]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = userRes.rows[0];

        // 2. Validate password if provided
        if (newPassword) {
            if (user.password !== oldPassword) {
                return res.status(401).json({ error: 'profile.error.invalid_current_password' });
            }
        }

        // 3. Check email uniqueness if changing
        if (newEmail && newEmail !== currentEmail) {
            const emailCheck = await query('SELECT email FROM users WHERE email = $1 UNION SELECT email FROM models WHERE email = $1', [newEmail]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'auth.error.email_in_use' });
            }
        }

        // 4. Update
        const updatedPseudo = pseudo || user.pseudo;
        const updatedEmail = newEmail || currentEmail;
        const updatedPassword = newPassword || user.password;

        await query(
            'UPDATE users SET pseudo = $1, email = $2, password = $3 WHERE email = $4',
            [updatedPseudo, updatedEmail, updatedPassword, currentEmail]
        );

        res.json({ success: true, user: { email: updatedEmail, pseudo: updatedPseudo } });
    } catch (err) {
        console.error('[Profile Update Error]', err);
        res.status(500).json({ error: 'api.error.internal_server_error' });
    }
});

module.exports = router;
