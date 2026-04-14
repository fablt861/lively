const Redis = require('ioredis');
const REDIS_URL = "rediss://default:gQAAAAAAAUj5AAIncDE2OTk1ZmM0MzQ4ZGU0NTE3OWY1ZGU4MmVlZDM0MTdmOXAxODQyMTc@assured-dane-84217.upstash.io:6379";

async function deepSearch() {
    const redis = new Redis(REDIS_URL);
    const keys = await redis.keys('*fabrice*');
    console.log('Keys matching fabrice:', keys);
    
    // Also search for the email itself
    const emailKeys = await redis.keys('*letourneur86*');
    console.log('Keys matching letourneur86:', emailKeys);
    
    redis.disconnect();
}

deepSearch();
