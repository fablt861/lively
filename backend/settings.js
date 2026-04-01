const { getRedisClient } = require('./redis');
const redis = getRedisClient();

const SETTINGS_KEY = 'global:settings';

const DEFAULT_SETTINGS = {
    pricePerMinute: 1.00,
    antiFraudDelaySec: 5,
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
    launchMode: false
};


async function initSettings() {
    console.log('=> Initializing settings...');
    try {
        const exists = await redis.exists(SETTINGS_KEY);
        if (!exists) {
            await redis.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        }
        console.log('=> Settings initialized.');
    } catch (err) {
        console.error('=> Failed to initialize settings:', err.message);
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
