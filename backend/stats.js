const { query } = require('./db');
const { getRedisClient } = require('./redis');
const redis = getRedisClient();

async function logNewUser() {
    // Increment persistent SQL count via INSERT (done in auth.js)
    // We can also increment a daily counter in Redis for fast access
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`stats:${today}`, 'new_users', 1);
}

async function logNewModel() {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`stats:${today}`, 'new_models', 1);
}

async function logNewClient() {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrby(`stats:${today}`, 'new_clients', 1);
}

async function logRevenue(usd) {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrbyfloat(`stats:${today}`, 'revenue_usd', usd);
}

async function logPurchase(usd) {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrbyfloat(`stats:${today}`, 'purchases_usd', usd);
}

async function logModelPayout(usd) {
    const today = new Date().toISOString().split('T')[0];
    await redis.hincrbyfloat(`stats:${today}`, 'model_payout_usd', usd);
}

async function getGlobalStats() {
    try {
        const res = await query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM models WHERE status != 'pending') as models
        `);
        return {
            totalUsers: parseInt(res.rows[0].users),
            totalModels: parseInt(res.rows[0].models),
            totalClients: 0 // Will implement client tracking in SQL later
        };
    } catch (err) {
        console.error('Error getting global stats:', err);
        return { totalUsers: 0, totalModels: 0, totalClients: 0 };
    }
}

async function getDailyStats(daysBack = 30) {
    const results = [];
    for (let i = 0; i < daysBack; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const key = `stats:${dateStr}`;
        const data = await redis.hgetall(key);

        results.push({
            date: dateStr,
            newUsers: parseInt(data.new_users || '0'),
            newClients: parseInt(data.new_clients || '0'),
            revenue: parseFloat(data.purchases_usd || '0'), // Switched to sales volume
            modelPayout: parseFloat(data.model_payout_usd || '0'),
            profit: parseFloat(data.purchases_usd || '0') - parseFloat(data.model_payout_usd || '0')
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

async function trackMarketingRevenue(src, camp, ad, amount, id) {
    const key = (src || camp || ad) ? `src:${src || ''}|camp:${camp || ''}|ad:${ad || ''}` : 'direct';
    await redis.hincrbyfloat(`marketing:users:stats:${key}`, 'revenue', amount);
    
    if (id) {
        const added = await redis.sadd(`marketing:users:clients:${key}`, id);
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
    // For extreme scale, we could query the SQL tables directly:
    // SELECT marketing_src, marketing_camp, marketing_ad, COUNT(*) FROM users GROUP BY ...
    // But historical visits IPs are better kept in Redis or a dedicated events table.
    // For now, continue using Redis for marketing counters but we know the Truth is in SQL signups.
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
    // Historical financial stats in Redis are combined with SQL-powered insights if needed.
    // At 4M users, we should summarize financial transactions into a daily_finances table.
    // For now, keep the aggregation logic but ensure it uses the Redis client correctly.
    const rawKeys = await redis.keys('stats:????-??-??');
    const sortedKeys = rawKeys.sort();
    
    const expKeys = await redis.keys('finances:marketing_expenses:????-??');
    const expenses = {};
    for (const k of expKeys) {
        const m = k.split(':').pop();
        expenses[m] = parseFloat(await redis.get(k) || '0');
    }
    
    const monthlyGroups = {};
    
    for (const key of sortedKeys) {
        const data = await redis.hgetall(key);
        const parts = key.split(':');
        if (parts.length < 2) continue;
        const month = parts[1].substring(0, 7);
        
        if (!monthlyGroups[month]) {
            monthlyGroups[month] = { ttc: 0, gains: 0 };
        }
        
        const purchases = parseFloat(data.purchases_usd || '0');
        const consumption = parseFloat(data.revenue_usd || '0');
        
        monthlyGroups[month].ttc += purchases > 0 ? purchases : consumption;
        monthlyGroups[month].gains += parseFloat(data.model_payout_usd || '0');
    }
    
    const results = Object.keys(monthlyGroups).sort((a,b) => b.localeCompare(a)).map(month => {
        const ttc = monthlyGroups[month].ttc;
        const ht = ttc / 1.2;
        const gains = monthlyGroups[month].gains;
        const fees = ttc * 0.05;
        const marketing = expenses[month] || 0;
        const profit = ht - gains - fees - marketing;
        
        return {
            month,
            revenue_ttc: ttc,
            revenue_ht: ht,
            model_gains: gains,
            processor_fees: fees,
            marketing_expense: marketing,
            net_profit: profit
        };
    });
    
    const totals = results.reduce((acc, curr) => ({
        revenue_ttc: acc.revenue_ttc + curr.revenue_ttc,
        revenue_ht: acc.revenue_ht + curr.revenue_ht,
        model_gains: acc.model_gains + curr.model_gains,
        processor_fees: acc.processor_fees + curr.processor_fees,
        marketing_expense: acc.marketing_expense + curr.marketing_expense,
        net_profit: acc.net_profit + curr.net_profit
    }), { revenue_ttc: 0, revenue_ht: 0, model_gains: 0, processor_fees: 0, marketing_expense: 0, net_profit: 0 });
    
    return { months: results, totals };
}

async function saveMarketingExpense(month, amount) {
    await redis.set(`finances:marketing_expenses:${month}`, amount);
}

module.exports = {
    logNewUser, logNewModel, logNewClient, logRevenue, logPurchase, logModelPayout,
    getGlobalStats, getDailyStats, getFinancialStats, saveMarketingExpense,
    trackMarketingVisit, trackMarketingSignup, trackMarketingRevenue, trackModelValidation, getMarketingStats
};
