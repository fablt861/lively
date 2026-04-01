const express = require('express');
const { getRedisClient } = require('./redis');
const { logNewUser } = require('./stats');
const crypto = require('crypto');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase();
    const redis = getRedisClient();

    // 1. Try Model
    const modelData = await redis.get(`model:active:${email}`);
    if (modelData) {
        const model = JSON.parse(modelData);
        if (model.status === 'banned') {
            return res.status(403).json({ error: 'auth.error.banned' });
        }
        if (model.password === password) {
            // Update last login
            await redis.set(`user:${email}:last_login`, new Date().toISOString());
            return res.json({
                success: true,
                token: `model-token-${email}`,
                user: { email, role: 'model', name: model.pseudo || model.name || `${model.firstName} ${model.lastName}` }
            });
        }
    }

    // 2. Try User
    const userData = await redis.get(`user:active:${email}`);
    if (userData) {
        const user = JSON.parse(userData);
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'auth.error.banned' });
        }
        if (user.password === password) {
            // Update last login
            await redis.set(`user:${email}:last_login`, new Date().toISOString());
            const credits = await redis.get(`user:${email}:credits`) || "0";
            return res.json({
                success: true,
                token: `user-token-${email}`,
                user: { email, role: 'user', name: user.name || user.pseudo, credits: parseFloat(credits) }
            });
        }
    }

    return res.status(401).json({ error: 'auth.error.invalid_credentials' });
});

router.post('/register', async (req, res) => {
    const { email: rawEmail, password, pseudo, src, camp, ad } = req.body;
    const email = rawEmail?.toLowerCase();
    const redis = getRedisClient();
    const { trackMarketingSignup } = require('./stats');

    if (!email || !password || !pseudo) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    const existingUser = await redis.get(`user:active:${email}`);
    const existingModel = await redis.get(`model:active:${email}`);
    if (existingUser || existingModel) {
        return res.status(400).json({ error: 'auth.error.email_in_use' });
    }

    const newUser = {
        id: crypto.randomUUID(),
        email,
        password,
        pseudo,
        role: 'user',
        registeredAt: new Date().toISOString(),
        marketing: { src, camp, ad }
    };

    await redis.set(`user:active:${email}`, JSON.stringify(newUser));
    await redis.set(`user:${email}:credits`, "5");
    await logNewUser();
    await trackMarketingSignup('user', src, camp, ad);

    res.json({
        success: true,
        token: `user-token-${email}`,
        user: { email, role: 'user', name: pseudo, credits: 5 }
    });
});

router.post('/add-credits', async (req, res) => {
    const { email: rawEmail, amount } = req.body;
    const email = rawEmail?.toLowerCase();
    const redis = getRedisClient();

    if (!email || !amount) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    const { trackMarketingRevenue } = require('./stats');

    const userData = await redis.get(`user:active:${email}`);
    if (!userData) {
        return res.status(404).json({ error: 'auth.error.user_not_found' });
    }

    const user = JSON.parse(userData);
    const { src, camp, ad } = user.marketing || {};

    let newCredits;
    const currentCredits = parseFloat((await redis.get(`user:${email}:credits`)) || '0');
    
    // If the user bled into a negative balance due to rapid testing or high consumption rates,
    // we strictly forgive the debt so their purchase isn't instantly eaten by it.
    if (currentCredits < 0) {
        newCredits = parseFloat(amount);
        await redis.set(`user:${email}:credits`, newCredits.toString());
    } else {
        newCredits = await redis.incrbyfloat(`user:${email}:credits`, amount);
    }

    await trackMarketingRevenue(src, camp, ad, amount, email);
    const { logPurchase } = require('./stats');
    await logPurchase(amount);

    res.json({
        success: true,
        credits: newCredits
    });
});

router.post('/model/register', async (req, res) => {
    const redis = getRedisClient();
    const { country, phone, firstName, lastName, pseudo, dob, email: rawEmail, password, photoProfile, photoId, photoIdSelfie, src, camp, ad } = req.body;
    const email = rawEmail?.toLowerCase();

    if (!email || !password || !firstName || !lastName || !photoProfile || !photoId || !photoIdSelfie) {
        return res.status(400).json({ error: 'auth.error.missing_fields' });
    }

    const { trackMarketingSignup } = require('./stats');

    const existing = await redis.get(`model:active:${email}`);
    if (existing) {
        return res.status(400).json({ error: 'auth.error.email_already_registered' });
    }

    const existingPending = await redis.get(`model:pending:${email}`);
    if (existingPending) {
        return res.status(400).json({ error: 'auth.error.request_pending' });
    }

    const payload = {
        id: crypto.randomUUID(),
        email,
        password,
        firstName,
        lastName,
        pseudo,
        dob,
        country,
        phone,
        photoProfile,
        photoId,
        photoIdSelfie,
        registeredAt: new Date().toISOString(),
        marketing: { src, camp, ad }
    };

    await redis.set(`model:pending:${email}`, JSON.stringify(payload));
    await trackMarketingSignup('model', src, camp, ad);
    res.json({ success: true, message: 'auth.success.registration_submitted' });
});

module.exports = router;
