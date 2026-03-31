const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function cleanup() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: node cleanup_balance.js <email>');
        process.exit(1);
    }

    console.log(`Cleaning up balance for ${email}...`);

    // 1. Reset Balance to $10.00
    await redis.set(`model:${email.toLowerCase()}:balance`, "10.00");
    
    // 2. Clear History (Optional, or just the last big entry)
    // For safety in this test script, we only reset the balance.
    // If the user wants to clear history, we can ltrim it.
    
    console.log('✅ Balance reset to $10.00');
    process.exit(0);
}

cleanup();
