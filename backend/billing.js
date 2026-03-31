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
    const sessionData = JSON.stringify({ 
        userId: String(userId).toLowerCase(), 
        modelId: String(modelId).toLowerCase(), 
        startTime: Date.now(),
        earnedUsd: 0,
        spentCredits: 0
    });
    await redis.hset(ACTIVE_ROOMS_KEY, roomId, sessionData);
    await redis.lpush('debug:billing', JSON.stringify({ event: 'start', roomId, userId, modelId, timestamp: Date.now() }));
    console.log(`[Billing] Started for room ${roomId}`);
}

async function stopBilling(roomId) {
    const sessionStr = await redis.hget(ACTIVE_ROOMS_KEY, roomId);
    if (!sessionStr) return;

    // Atomically take ownership of this session to prevent double-billing
    const deletedCount = await redis.hdel(ACTIVE_ROOMS_KEY, roomId);
    if (deletedCount === 0) {
        console.log(`[Billing] Room ${roomId} already processed.`);
        return;
    }

    const session = JSON.parse(sessionStr);
    const durationSec = Math.floor((Date.now() - session.startTime) / 1000);

    // Normalize IDs
    const modelId = String(session.modelId).toLowerCase();
    const userId = String(session.userId).toLowerCase();

    // Use accumulated totals instead of recalculating (prevents ghost billing)
    const modelEarned = (session.earnedUsd || 0).toFixed(4);
    const userSpentCredits = (session.spentCredits || 0).toFixed(4);

    const userSpentUsd = parseFloat(userSpentCredits) / 10.0;
    
    // Only log if there were actual earnings (ignore 0-sec ghost sessions)
    if (parseFloat(modelEarned) > 0 || parseFloat(userSpentCredits) > 0) {
        await logRevenue(userSpentUsd);
        await logModelPayout(parseFloat(modelEarned));

        // Update Total Spent (Balance was updated incrementally)
        await redis.incrbyfloat(`user:${userId}:total_spent`, userSpentUsd);
        
        // Save to history
        const historyEntry = {
            roomId,
            userId: userId,
            modelId: modelId,
            durationSec,
            modelEarned: parseFloat(modelEarned),
            userSpentCredits: parseFloat(userSpentCredits),
            timestamp: Date.now()
        };

        await redis.lpush(`model:${modelId}:history`, JSON.stringify(historyEntry));
        await redis.lpush(`user:${userId}:history`, JSON.stringify(historyEntry));
    }

    await redis.lpush('debug:billing', JSON.stringify({ event: 'stop', roomId, userId, modelId, durationSec, modelEarned, timestamp: Date.now() }));
    console.log(`[Billing] Stopped for room ${roomId}. Duration: ${durationSec}s. Earned: $${modelEarned}`);
}

// Global loop that ticks every second
function initBillingLoop(io) {
    if (billingInterval) return;
    billingInterval = setInterval(async () => {
        try {
            const rooms = await redis.hgetall(ACTIVE_ROOMS_KEY);
            for (const roomId in rooms) {
                const session = JSON.parse(rooms[roomId]);

                // Check if room still has active sockets
                if (io) {
                    const activeRoom = io.sockets.adapter.rooms.get(roomId);
                    if (!activeRoom || activeRoom.size === 0) {
                        console.log(`[Billing] Room ${roomId} is empty. Auto-closing ghost session.`);
                        await stopBilling(roomId);
                        continue;
                    }
                }

                const durationSec = Math.floor((Date.now() - session.startTime) / 1000);
                const settings = await getSettings();
                const rateModelUsdPerSec = settings.modelPayoutPerMinute / 60.0;
                const rateUserCreditsPerSec = settings.pricePerMinute * 10 / 60.0;

                // 1. Model Pay (Incremental)
                // Only pay after anti-fraud delay
                if (durationSec > settings.antiFraudDelaySec) {
                    await redis.incrbyfloat(`model:${session.modelId}:balance`, rateModelUsdPerSec);
                    await redis.incrbyfloat(`model:${session.modelId}:total_gains`, rateModelUsdPerSec);
                    session.earnedUsd = (session.earnedUsd || 0) + rateModelUsdPerSec;
                }

                // 2. User Deduction (Incremental)
                if (session.userId.includes('@')) {
                    // Registered user: deduct and check balance
                    const remaining = await redis.incrbyfloat(`user:${session.userId}:credits`, -rateUserCreditsPerSec);
                    session.spentCredits = (session.spentCredits || 0) + rateUserCreditsPerSec;

                    if (remaining <= 0) {
                        console.log(`[Billing] Registered user ${session.userId} out of credits. Stopping session.`);
                        if (io) {
                            io.to(roomId).emit('out_of_credits', { role: 'user' });
                            io.to(roomId).emit('partner_out_of_credits', { role: 'model' });
                        }
                        await stopBilling(roomId);
                        continue;
                    }
                } else {
                    // Guest user (userId is IP)
                    const nextVal = await redis.incrbyfloat(`free_secs:${session.userId}`, 1);
                    session.spentCredits = (session.spentCredits || 0) + rateUserCreditsPerSec; // Just for logging

                    if (nextVal >= 60) {
                        console.log(`[Billing] Guest ${session.userId} reached limit. Stopping.`);
                        if (io) {
                            io.to(roomId).emit('out_of_credits', { role: 'user' });
                            io.to(roomId).emit('partner_out_of_credits', { role: 'model' });
                        }
                        await stopBilling(roomId);
                        continue;
                    }
                }

                // 3. Update session object in Redis with latest totals
                await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));
            }
        } catch (err) {
            console.error('[Billing Loop Error]', err.message);
        }
    }, 1000);
    console.log('[Billing] Per-second billing loop initialized.');
}

async function getModelStats(modelId) {
    const normalizedId = modelId.toLowerCase();
    const balanceStr = await redis.get(`model:${normalizedId}:balance`);
    const historyStrs = await redis.lrange(`model:${normalizedId}:history`, 0, 50); // Get last 50 calls

    return {
        balance: parseFloat(balanceStr || '0'),
        history: historyStrs.map(h => JSON.parse(h))
    };
}

module.exports = { startBilling, stopBilling, initBillingLoop, getModelStats };
