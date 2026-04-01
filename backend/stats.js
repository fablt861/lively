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

async function logPurchase(usd) {
    await redis.hincrbyfloat(getTodayKey(), 'purchases_usd', usd);
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

async function trackMarketingVisit(type, src, camp, ad, ip) {
    const role = type === 'model' ? 'models' : 'users';
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    
    if (ip) {
        const isNew = await redis.sadd(`marketing:${role}:visitors:${key}`, ip);
        if (!isNew) return;
    }

    await redis.hincrby(`marketing:${role}:stats:${key}`, 'visits', 1);
    await redis.sadd(`marketing:${role}:active_keys`, key);
}

async function trackMarketingSignup(type, src, camp, ad) {
    const role = type === 'model' ? 'models' : 'users';
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrby(`marketing:${role}:stats:${key}`, 'signups', 1);
    await redis.sadd(`marketing:${role}:active_keys`, key);
}

async function trackMarketingRevenue(src, camp, ad, amount, email) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrbyfloat(`marketing:users:stats:${key}`, 'revenue', amount);
    
    if (email) {
        const added = await redis.sadd(`marketing:users:clients:${key}`, email);
        if (added) {
            await redis.hincrby(`marketing:users:stats:${key}`, 'clients_count', 1);
        }
    }
    await redis.sadd('marketing:users:active_keys', key);
}

async function trackModelValidation(src, camp, ad) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrby(`marketing:models:stats:${key}`, 'validated', 1);
    await redis.sadd('marketing:models:active_keys', key);
}

async function getMarketingStats(type) {
    const role = type === 'model' ? 'models' : 'users';
    const keys = await redis.smembers(`marketing:${role}:active_keys`);
    const results = [];
    for (const key of keys) {
        const data = await redis.hgetall(`marketing:${role}:stats:${key}`);
        if (type === 'model') {
            results.push({
                id: key,
                visits: parseInt(data.visits || '0'),
                signups: parseInt(data.signups || '0'),
                validated: parseInt(data.validated || '0')
            });
        } else {
            results.push({
                id: key,
                visits: parseInt(data.visits || '0'),
                signups: parseInt(data.signups || '0'),
                clients: parseInt(data.clients_count || '0'),
                revenue: parseFloat(data.revenue || '0')
            });
        }
    }
    return results;
}

async function getFinancialStats() {
    // 1. Get all daily stats keys
    const rawKeys = await redis.keys('stats:????-??-??');
    const sortedKeys = rawKeys.sort(); // Chronological
    
    const monthlyGroups = {}; // { '2026-04': { ttc: 0, gains: 0 } }
    
    for (const key of sortedKeys) {
        const data = await redis.hgetall(key);
        const month = key.split(':')[1].substring(0, 7); // '2026-04'
        
        if (!monthlyGroups[month]) {
            monthlyGroups[month] = { ttc: 0, gains: 0 };
        }
        
        // Use purchases_usd (Sales) as primary, fallback to historical revenue_usd (Consumption)
        const purchases = parseFloat(data.purchases_usd || '0');
        const consumption = parseFloat(data.revenue_usd || '0');
        
        // If it's a historical month where we didn't have purchases_usd yet, 
        // we use consumption as a proxy for TTC Revenue.
        monthlyGroups[month].ttc += purchases > 0 ? purchases : consumption;
        monthlyGroups[month].gains += parseFloat(data.model_payout_usd || '0');
    }
    
    const results = Object.keys(monthlyGroups).sort((a,b) => b.localeCompare(a)).map(month => {
        const ttc = monthlyGroups[month].ttc;
        const ht = ttc / 1.2;
        const gains = monthlyGroups[month].gains;
        const fees = ttc * 0.05;
        const profit = ht - gains - fees;
        
        return {
            month,
            revenue_ttc: ttc,
            revenue_ht: ht,
            model_gains: gains,
            processor_fees: fees,
            net_profit: profit
        };
    });
    
    const totals = results.reduce((acc, curr) => ({
        revenue_ttc: acc.revenue_ttc + curr.revenue_ttc,
        revenue_ht: acc.revenue_ht + curr.revenue_ht,
        model_gains: acc.model_gains + curr.model_gains,
        processor_fees: acc.processor_fees + curr.processor_fees,
        net_profit: acc.net_profit + curr.net_profit
    }), { revenue_ttc: 0, revenue_ht: 0, model_gains: 0, processor_fees: 0, net_profit: 0 });
    
    return { months: results, totals };
}

module.exports = {
    logNewUser, logNewModel, logNewClient, logRevenue, logPurchase, logModelPayout,
    getGlobalStats, getDailyStats, getFinancialStats,
    trackMarketingVisit, trackMarketingSignup, trackMarketingRevenue, trackModelValidation, getMarketingStats
};
