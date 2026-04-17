// Trigger Vercel Build - 2026-04-17 10:20
const { query } = require('./db');
const { getRedisClient } = require('./redis');

async function debug() {
    const redis = getRedisClient();
    const emails = ['user2@kinky.live', 'model2@kinky.live'];
    
    for (const email of emails) {
        console.log(`\n--- Debugging: ${email} ---`);
        
        // 1. Check SQL
        const uRes = await query('SELECT pseudo, role FROM (SELECT email, pseudo, \'user\' as role FROM users UNION SELECT email, pseudo, \'model\' as role FROM models) as all_users WHERE LOWER(email) = $1', [email.toLowerCase()]);
        console.log('SQL Result:', uRes.rows);
        
        // 2. Check Redis
        const cached = await redis.hget(`profile:${email.toLowerCase()}`, 'pseudo');
        console.log('Redis Pseudo Cache:', cached);
    }
    process.exit();
}

debug();
