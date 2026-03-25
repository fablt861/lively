const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

        redisClient.on('error', (err) => {
            console.error('[Redis Error]', err.message);
        });
    }
    return redisClient;
}

module.exports = { getRedisClient };
