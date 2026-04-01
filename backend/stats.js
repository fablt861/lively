const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function getTodayKey() {
    const d = new Date();
    return `stats:${d.toISOString().split('T')[0]}`;
}

async function logNewUser() {
    await redis.hincrby(getTodayKey(), 'new_users', 1);
    await redis.incr('global:total_users');
}

async function logNewModel() {
    await redis.incr('global:total_models');
}

async function logNewClient() {
    await redis.hincrby(getTodayKey(), 'new_clients', 1);
    await redis.incr('global:total_clients');
}

async function logRevenue(usd) {
    await redis.hincrbyfloat(getTodayKey(), 'revenue_usd', usd);
}

async function logModelPayout(usd) {
    await redis.hincrbyfloat(getTodayKey(), 'model_payout_usd', usd);
}

async function getGlobalStats() {
    return {
        totalUsers: parseInt(await redis.get('global:total_users') || '0'),
        totalModels: parseInt(await redis.get('global:total_models') || '0'),
        totalClients: parseInt(await redis.get('global:total_clients') || '0'),
    };
}

async function getDailyStats(daysBack = 30) {
    const results = [];
    for (let i = 0; i < daysBack; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const key = `stats:${dateStr}`;
        const data = await redis.hgetall(key);

        // Only include if there is data (or we can return 0s)
        results.push({
            date: dateStr,
            newUsers: parseInt(data.new_users || '0'),
            newClients: parseInt(data.new_clients || '0'),
            revenue: parseFloat(data.revenue_usd || '0'),
            modelPayout: parseFloat(data.model_payout_usd || '0'),
            profit: parseFloat(data.revenue_usd || '0') - parseFloat(data.model_payout_usd || '0')
        });
    }
    return results;
}

async function trackMarketingVisit(src, camp, ad, ip) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    
    // Uniqueness check based on IP
    if (ip) {
        const isNew = await redis.sadd(`marketing:visitors:${key}`, ip);
        if (!isNew) return; // Not a unique visit
    }

    await redis.hincrby(`marketing:stats:${key}`, 'visits', 1);
    await redis.sadd('marketing:active_keys', key);
}

async function trackMarketingSignup(src, camp, ad) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrby(`marketing:stats:${key}`, 'signups', 1);
    await redis.sadd('marketing:active_keys', key);
}

async function trackMarketingRevenue(src, camp, ad, amount, email) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrbyfloat(`marketing:stats:${key}`, 'revenue', amount);
    
    // Tracking unique clients per source
    if (email) {
        const added = await redis.sadd(`marketing:clients:${key}`, email);
        if (added) {
            await redis.hincrby(`marketing:stats:${key}`, 'clients_count', 1);
        }
    }
    await redis.sadd('marketing:active_keys', key);
}

async function getMarketingStats() {
    const keys = await redis.smembers('marketing:active_keys');
    const results = [];
    for (const key of keys) {
        const data = await redis.hgetall(`marketing:stats:${key}`);
        results.push({
            id: key,
            visits: parseInt(data.visits || '0'),
            signups: parseInt(data.signups || '0'),
            clients: parseInt(data.clients_count || '0'),
            revenue: parseFloat(data.revenue || '0')
        });
    }
    return results;
}

module.exports = {
    logNewUser, logNewModel, logNewClient, logRevenue, logModelPayout,
    getGlobalStats, getDailyStats,
    trackMarketingVisit, trackMarketingSignup, trackMarketingRevenue, getMarketingStats
};
