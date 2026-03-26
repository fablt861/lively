const Redis = require('ioredis');
require('dotenv').config();
const { initSettings } = require('./settings');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function reset() {
    console.log('--- Database Reset Initiated ---');

    // 1. Wipe everything
    console.log('=> Flushing all keys...');
    await redis.flushall();

    // 2. Re-initialize settings
    console.log('=> Re-initializing settings...');
    await initSettings();

    // 3. Reset Global Counters
    console.log('=> Resetting global counters...');
    await redis.set('global:total_users', '0');
    await redis.set('global:total_models', '0');
    await redis.set('global:total_clients', '0');

    console.log('--- Database Reset Complete ---');
    process.exit(0);
}

reset().catch(err => {
    console.error('Reset failed:', err);
    process.exit(1);
});
