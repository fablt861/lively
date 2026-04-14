const Redis = require('ioredis');

const REDIS_URL = "rediss://default:gQAAAAAAAUj5AAIncDE2OTk1ZmM0MzQ4ZGU0NTE3OWY1ZGU4MmVlZDM0MTdmOXAxODQyMTc@assured-dane-84217.upstash.io:6379";

async function inspect() {
    const redis = new Redis(REDIS_URL);
    const keys = await redis.keys('*');
    console.log('Total keys:', keys.length);
    console.log('Sample keys:', keys.slice(0, 50));
    
    const fabriceUser = await redis.get('user:active:fabrice.letourneur86@gmail.com');
    const fabriceModel = await redis.get('model:active:fabrice.letourneur86@gmail.com');
    console.log('Fabrice User exists:', !!fabriceUser);
    console.log('Fabrice Model exists:', !!fabriceModel);
    
    redis.disconnect();
}

inspect();
