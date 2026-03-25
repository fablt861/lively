const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SETTINGS_KEY = 'global:settings';

const DEFAULT_SETTINGS = {
    pricePerMinute: 1.00,
    modelPayoutPerMinute: 0.40,
    antiFraudDelaySec: 5,
    packs: [
        { id: 'essential', name: 'Essential', credits: 100, priceUsd: 9.99 },
        { id: 'premium', name: 'Premium', credits: 300, priceUsd: 24.99 },
        { id: 'privilege', name: 'Privilege', credits: 1300, priceUsd: 99.99 }
    ]
};

async function initSettings() {
    const exists = await redis.exists(SETTINGS_KEY);
    if (!exists) {
        await redis.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
}

async function getSettings() {
    const data = await redis.get(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

async function updateSettings(newSettings) {
    await redis.set(SETTINGS_KEY, JSON.stringify(newSettings));
    return newSettings;
}

module.exports = { initSettings, getSettings, updateSettings };
