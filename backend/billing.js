const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const { getSettings } = require('./settings');
const { logRevenue, logModelPayout } = require('./stats');

redis.on('error', (err) => {
    console.error('[Billing Redis Error]', err.message);
});

// Store active sessions in a Redis Hash
const ACTIVE_ROOMS_KEY = 'billing:active_rooms';

let ioInstance = null;
let billingInterval = null;

/**
 * Initialize billing with Socket.io instance
 */
function initBillingLoop(io) {
    ioInstance = io;
    if (billingInterval) return;
    
    billingInterval = setInterval(async () => {
        try {
            const rooms = await redis.hgetall(ACTIVE_ROOMS_KEY);
            const roomIds = Object.keys(rooms);
            
            for (const roomId of roomIds) {
                try {
                    const session = JSON.parse(rooms[roomId]);

                    // 1. Verify room still exists in socket.io
                    if (ioInstance) {
                        const activeRoom = ioInstance.sockets.adapter.rooms.get(roomId);
                        if (!activeRoom || activeRoom.size === 0) {
                            // Give it a 5-second grace period before closing
                            session.emptyTicks = (session.emptyTicks || 0) + 1;
                            console.log(`[Billing] Room ${roomId} is empty (Tick ${session.emptyTicks}/5).`);
                            
                            if (session.emptyTicks >= 5) {
                                console.log(`[Billing] Room ${roomId} exceeded grace period. Auto-closing.`);
                                await stopBilling(roomId);
                                continue;
                            }
                            // Update session with new tick count
                            await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));
                        } else {
                            // Reset grace period if sockets are found
                            if (session.emptyTicks) {
                                delete session.emptyTicks;
                                await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));
                            }
                        }
                    }

                    const settings = await getSettings();
                    const rateUserCreditsPerSec = (settings.pricePerMinute * 10) / 60.0;
                    const rateModelUsdPerSec = settings.modelPayoutPerMinute / 60.0;

                    // 2. Decrement User Credits
                    let remaining = 0;
                    if (session.userId.includes('@')) {
                        // Registered user: decrement in Redis
                        remaining = await redis.incrbyfloat(`user:${session.userId}:credits`, -rateUserCreditsPerSec);
                        
                        console.log(`[Billing Loop] User ${session.userId} | Remaining: ${remaining} | Room: ${roomId}`);

                        // Sync to room (User will pick it up)
                        if (ioInstance) {
                            ioInstance.to(roomId).emit('credits_update', Math.max(0, remaining));
                        }

                        if (remaining <= 0) {
                            console.log(`[Billing] User ${session.userId} out of credits.`);
                            if (ioInstance) {
                                ioInstance.to(roomId).emit('out_of_credits', { reason: 'balance_exhausted' });
                                ioInstance.to(roomId).emit('partner_out_of_credits');
                            }
                            await stopBilling(roomId);
                            continue;
                        }
                    } else {
                        // Guest user: increment time used
                        const used = await redis.incrby(`free_secs:${session.userId}`, 1);
                        remaining = 60 - used;
                        
                        // Sync to room (User will pick it up)
                        if (ioInstance) {
                            ioInstance.to(roomId).emit('credits_update', Math.max(0, remaining));
                        }

                        if (used >= 60) {
                            console.log(`[Billing] Guest ${session.userId} reached time limit.`);
                            if (ioInstance) {
                                ioInstance.to(roomId).emit('out_of_credits', { reason: 'guest_limit_reached' });
                                ioInstance.to(roomId).emit('partner_out_of_credits');
                            }
                            await stopBilling(roomId);
                            continue;
                        }
                    }
                    session.spentCredits = (session.spentCredits || 0) + rateUserCreditsPerSec;

                    // 3. Increment Model Earnings
                    const durationSec = Math.floor((Date.now() - session.startTime) / 1000);
                    if (durationSec > settings.antiFraudDelaySec) {
                        await redis.incrbyfloat(`model:${session.modelId}:balance`, rateModelUsdPerSec);
                        await redis.incrbyfloat(`model:${session.modelId}:total_gains`, rateModelUsdPerSec);
                        session.earnedUsd = (session.earnedUsd || 0) + rateModelUsdPerSec;
                    }

                    // Update session state in Redis
                    await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));

                } catch (err) {
                    console.error(`[Billing Loop Error] Room ${roomId}:`, err.message);
                }
            }
        } catch (err) {
            console.error('[Billing Loop Global Error]', err.message);
        }
    }, 1000);
    console.log('[Billing] Per-second billing loop initialized.');
}

async function startBilling(roomId, userId, modelId, userSocketId, modelSocketId) {
    const sessionData = JSON.stringify({ 
        userId: String(userId).toLowerCase(), 
        modelId: String(modelId).toLowerCase(), 
        userSocketId,
        modelSocketId,
        startTime: Date.now(),
        earnedUsd: 0,
        spentCredits: 0
    });
    await redis.hset(ACTIVE_ROOMS_KEY, roomId, sessionData);
    await redis.lpush('debug:billing', JSON.stringify({ event: 'start', roomId, userId, modelId, timestamp: Date.now() }));
    console.log(`[Billing] Started for room ${roomId}. User: ${userId}, Model: ${modelId}`);
    // Loop is already running globally if initialized via server.js
}

async function stopBilling(roomId) {
    const sessionStr = await redis.hget(ACTIVE_ROOMS_KEY, roomId);
    if (!sessionStr) return;

    // Atomically take ownership of this session to prevent double-billing
    const deletedCount = await redis.hdel(ACTIVE_ROOMS_KEY, roomId);
    if (deletedCount === 0) return;

    const session = JSON.parse(sessionStr);
    const durationSec = Math.floor((Date.now() - session.startTime) / 1000);

    const modelId = String(session.modelId).toLowerCase();
    const userId = String(session.userId).toLowerCase();

    const modelEarned = (session.earnedUsd || 0).toFixed(4);
    const userSpentCredits = (session.spentCredits || 0).toFixed(4);
    const userSpentUsd = parseFloat(userSpentCredits) / 10.0;
    
    if (parseFloat(modelEarned) > 0 || parseFloat(userSpentCredits) > 0) {
        await logRevenue(userSpentUsd);
        await logModelPayout(parseFloat(modelEarned));
        await redis.incrbyfloat(`user:${userId}:total_spent`, userSpentUsd);
        
        const historyEntry = {
            roomId,
            userId,
            modelId,
            durationSec,
            modelEarned: parseFloat(modelEarned),
            userSpentCredits: parseFloat(userSpentCredits),
            timestamp: Date.now()
        };

        await redis.lpush(`model:${modelId}:history`, JSON.stringify(historyEntry));
        await redis.lpush(`user:${userId}:history`, JSON.stringify(historyEntry));
    }

    await redis.lpush('debug:billing', JSON.stringify({ event: 'stop', roomId, userId, modelId, durationSec, modelEarned, timestamp: Date.now() }));
    console.log(`[Billing] Stopped room ${roomId}. Duration: ${durationSec}s. Earned: $${modelEarned}`);
}

async function getModelStats(modelId) {
    const normalizedId = modelId.toLowerCase();
    const balanceStr = await redis.get(`model:${normalizedId}:balance`);
    const historyStrs = await redis.lrange(`model:${normalizedId}:history`, 0, 50);

    return {
        balance: parseFloat(balanceStr || '0'),
        history: historyStrs.map(h => JSON.parse(h))
    };
}

module.exports = { startBilling, stopBilling, initBillingLoop, getModelStats };
