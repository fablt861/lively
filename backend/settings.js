const { getRedisClient } = require('./redis');
const redis = getRedisClient();
const db = require('./db');

const SETTINGS_KEY = 'global:settings';

const DEFAULT_SETTINGS = {
    pricePerMinute: 1.00,
    antiFraudDelaySec: 5,
    creditsPerMinute: 10,
    guestFreeCredits: 5.0,
    registrationWelcomeCredits: 5.0,
    payoutTiers: [
        { label: 'Tier 1', minMinutes: 0, rate: 0.40 },
        { label: 'Tier 2', minMinutes: 5, rate: 0.50 },
        { label: 'Tier 3', minMinutes: 10, rate: 0.55 }
    ],
    packs: [
        { id: 'essential', name: 'Essential', credits: 100, priceUsd: 9.99 },
        { id: 'premium', name: 'Premium', credits: 300, priceUsd: 24.99 },
        { id: 'privilege', name: 'Privilege', credits: 1300, priceUsd: 99.99 }
    ],
    maintenanceMode: false,
    launchMode: false,
    blockDurationMin: 30,
    blockCreditsCost: 600,
    blockModelGain: 25,
    blockSpecialPackPrice: 59,
    restrictedCountries: [],
    teaserEnabled: false,
    teaserVideoUrl: ""
};


async function initSettings() {
    console.log('=> Initializing settings...');
    try {
        // 1. Try to load from Postgres
        const pgRes = await db.query('SELECT value FROM platform_settings WHERE key = $1', [SETTINGS_KEY]);
        
        if (pgRes.rows.length > 0) {
            console.log('=> Settings loaded from Postgres. Syncing to Redis cache...');
            const settings = pgRes.rows[0].value;
            await redis.set(SETTINGS_KEY, JSON.stringify(settings));
        } else {
            // 2. Fallback to Redis (maybe they exist from before migration)
            const redisData = await redis.get(SETTINGS_KEY);
            if (redisData) {
                console.log('=> Settings found in Redis. Migrating to Postgres...');
                const settings = JSON.parse(redisData);
                await db.query('INSERT INTO platform_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [SETTINGS_KEY, settings]);
            } else {
                // 3. Both empty, use defaults
                console.log('=> No settings found. Initializing with defaults...');
                await db.query('INSERT INTO platform_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [SETTINGS_KEY, DEFAULT_SETTINGS]);
                await redis.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
            }
        }
        console.log('=> Settings synchronized.');
    } catch (err) {
        console.error('=> Failed to initialize settings:', err.message);
    }
}

async function getSettings() {
    try {
        // Fast path: Redis cache
        const cache = await redis.get(SETTINGS_KEY);
        if (cache) return JSON.parse(cache);

        // Fallback: Postgres
        const pgRes = await db.query('SELECT value FROM platform_settings WHERE key = $1', [SETTINGS_KEY]);
        if (pgRes.rows.length > 0) {
            const settings = pgRes.rows[0].value;
            await redis.set(SETTINGS_KEY, JSON.stringify(settings)); // Re-cache
            return settings;
        }
    } catch (err) {
        console.error('[Settings] Error reading settings:', err.message);
    }
    return DEFAULT_SETTINGS;
}

async function updateSettings(newSettings) {
    try {
        // Update Postgres
        await db.query('INSERT INTO platform_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()', [SETTINGS_KEY, newSettings]);
        
        // Update Redis Cache
        await redis.set(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (err) {
        console.error('[Settings] Error updating settings:', err.message);
        throw err;
    }
    return newSettings;
}

module.exports = { initSettings, getSettings, updateSettings };
