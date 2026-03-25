const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const { getSettings } = require('./settings');
const { logRevenue, logModelPayout } = require('./stats');

redis.on('error', (err) => {
    console.error('[Billing Redis Error]', err.message);
});

// Store active sessions in a Redis Hash
const ACTIVE_ROOMS_KEY = 'billing:active_rooms';

let billingInterval = null;

async function startBilling(roomId, userId, modelId) {
    const sessionData = JSON.stringify({ userId, modelId, startTime: Date.now() });
    await redis.hset(ACTIVE_ROOMS_KEY, roomId, sessionData);
    console.log(`[Billing] Started for room ${roomId}`);
}

async function stopBilling(roomId) {
    const sessionStr = await redis.hget(ACTIVE_ROOMS_KEY, roomId);
    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const durationSec = Math.floor((Date.now() - session.startTime) / 1000);

        // Calculate final earnings/spend
        const settings = await getSettings();
        const rateModelUsdPerSec = settings.modelPayoutPerMinute / 60.0;
        const rateUserCreditsPerSec = settings.pricePerMinute * 10 / 60.0; // Assuming 1$ = 10c

        // Anti-fraud: only bill model if duration > delay
        const effectiveModelSecs = Math.max(0, durationSec - settings.antiFraudDelaySec);
        const modelEarned = (effectiveModelSecs * rateModelUsdPerSec).toFixed(4);
        const userSpentCredits = (durationSec * rateUserCreditsPerSec).toFixed(4);

        // Log platform revenue (mock calc: user spend in USD minus model payout)
        // If 10 credits = 1$, then userSpentUsd = userSpentCredits / 10
        const userSpentUsd = parseFloat(userSpentCredits) / 10.0;
        await logRevenue(userSpentUsd);
        await logModelPayout(parseFloat(modelEarned));

        // Save to history
        const historyEntry = {
            roomId,
            userId: session.userId,
            modelId: session.modelId,
            durationSec,
            modelEarned: parseFloat(modelEarned),
            userSpentCredits: parseFloat(userSpentCredits),
            timestamp: Date.now()
        };

        await redis.lpush(`model:${session.modelId}:history`, JSON.stringify(historyEntry));
        await redis.lpush(`user:${session.userId}:history`, JSON.stringify(historyEntry));

        await redis.hdel(ACTIVE_ROOMS_KEY, roomId);
        console.log(`[Billing] Stopped for room ${roomId}. Duration: ${durationSec}s`);
    }
}

// Global loop that ticks every second
function initBillingLoop() {
    if (billingInterval) return;
    billingInterval = setInterval(async () => {
        try {
            const rooms = await redis.hgetall(ACTIVE_ROOMS_KEY);
            for (const roomId in rooms) {
                const session = JSON.parse(rooms[roomId]);

                const durationSec = Math.floor((Date.now() - session.startTime) / 1000);

                const settings = await getSettings();
                const rateUserCreditsPerSec = settings.pricePerMinute * 10 / 60.0;
                const rateModelUsdPerSec = settings.modelPayoutPerMinute / 60.0;

                // Atomically deduct user credits
                await redis.decrbyfloat(`user:${session.userId}:credits`, rateUserCreditsPerSec);

                // Anti-fraud: Model earns only after antiFraudDelaySec seconds
                if (durationSec > settings.antiFraudDelaySec) {
                    await redis.incrbyfloat(`model:${session.modelId}:balance`, rateModelUsdPerSec);
                }
            }
        } catch (err) {
            console.error('[Billing Loop Error]', err.message);
        }
    }, 1000);
    console.log('[Billing] Per-second billing loop initialized.');
}

async function getModelStats(modelId) {
    const balanceStr = await redis.get(`model:${modelId}:balance`);
    const historyStrs = await redis.lrange(`model:${modelId}:history`, 0, 50); // Get last 50 calls

    return {
        balance: parseFloat(balanceStr || '0'),
        history: historyStrs.map(h => JSON.parse(h))
    };
}

module.exports = { startBilling, stopBilling, initBillingLoop, getModelStats };
