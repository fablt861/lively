const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function diagnose(email) {
    const balance = await redis.get(`model:${email}:balance`);
    const totalGains = await redis.get(`model:${email}:total_gains`);
    const history = await redis.lrange(`model:${email}:history`, 0, -1);
    
    console.log('--- Diagnosis for', email, '---');
    console.log('Balance Key:', balance);
    console.log('Total Gains Key:', totalGains);
    console.log('History Entries:', history.length);
    
    let sumHistory = 0;
    history.forEach((h, i) => {
        const entry = JSON.parse(h);
        sumHistory += entry.modelEarned;
        console.log(`Session ${i}: ${entry.durationSec}s -> $${entry.modelEarned}`);
    });
    
    console.log('Sum of History:', sumHistory);
    console.log('Diff (History - Balance):', sumHistory - parseFloat(balance || 0));
    
    process.exit(0);
}

const target = 'fablt86@hotmail.com'; // Assumed from context if it's the test user
diagnose(target);
