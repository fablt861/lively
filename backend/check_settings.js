const { getRedisClient } = require('./redis');

async function checkSettings() {
    const redis = getRedisClient();
    try {
        const settingsRaw = await redis.get('global:settings');
        console.log("Current Settings in Redis:", settingsRaw);
        
        // Also let's check the user's balance
        const keys = await redis.keys('user:*:credits');
        if (keys.length > 0) {
            console.log("User Balances:");
            for (const key of keys) {
                const bal = await redis.get(key);
                console.log(`${key} => ${bal}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        redis.quit();
    }
}

checkSettings();
