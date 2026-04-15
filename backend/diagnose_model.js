const { query } = require('./db');
const { getRedisClient } = require('./redis');
const redis = getRedisClient();

async function diagnose(identifier) {
    let id = identifier;
    let email = identifier;

    // Try to resolve identifier to ID if it's an email
    if (identifier.includes('@')) {
        const res = await query('SELECT id FROM models WHERE email = $1', [identifier.toLowerCase()]);
        if (res.rows.length > 0) {
            id = res.rows[0].id;
        }
    } else {
        const res = await query('SELECT email FROM models WHERE id = $1', [identifier]);
        if (res.rows.length > 0) {
            email = res.rows[0].email;
        }
    }

    const balance = await redis.get(`model:${id}:balance`);
    const totalGains = await redis.get(`model:${id}:total_gains`);
    const history = await redis.lrange(`model:${id}:history`, 0, -1);
    
    console.log('--- Diagnosis for ID:', id, 'Email:', email, '---');
    console.log('Balance:', balance);
    console.log('Total Gains:', totalGains);
    console.log('History Entries:', history.length);
    
    let sumHistory = 0;
    history.forEach((h, i) => {
        try {
            const entry = JSON.parse(h);
            sumHistory += entry.modelEarned;
            if (i < 10) console.log(`Session ${i}: ${entry.durationSec}s -> $${entry.modelEarned}`);
        } catch (e) {}
    });
    
    console.log('Sum of History:', sumHistory);
    console.log('Diff (History - Balance):', sumHistory - parseFloat(balance || 0));
    
    process.exit(0);
}

const target = process.argv[2] || 'fablt86@hotmail.com';
diagnose(target);
