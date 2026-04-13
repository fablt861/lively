const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        const options = {};
        if (process.env.REDIS_PREFIX) {
            options.keyPrefix = process.env.REDIS_PREFIX;
        }
        
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', options);

        redisClient.on('error', (err) => {
            console.error('[Redis Error]', err.message);
        });
        
        if (process.env.REDIS_PREFIX) {
            console.log(`[Redis] Using key prefix: ${process.env.REDIS_PREFIX}`);
        }
    }
    return redisClient;
}

module.exports = { getRedisClient };
