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

module.exports = {
    logNewUser, logNewModel, logNewClient, logRevenue, logModelPayout,
    getGlobalStats, getDailyStats
};
