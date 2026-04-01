const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function check() {
  try {
    const keys = await redis.keys('stats:*');
    console.log('Total stats keys:', keys.length);
    for (const key of keys.sort().slice(-10)) {
      const data = await redis.hgetall(key);
      console.log(`Key: ${key}`, data);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
