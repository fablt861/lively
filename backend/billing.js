const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const { getSettings } = require('./settings');
const { markAsSeen } = require('./moderation');
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
                            // Give it a 20-second grace period before closing
                            session.emptyTicks = (session.emptyTicks || 0) + 1;
                            console.log(`[Billing] Room ${roomId} is empty (Tick ${session.emptyTicks}/20).`);
                            
                            if (session.emptyTicks >= 20) {
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
                    let rateUserCreditsPerSec;
                    let activeRate = settings.modelPayoutPerMinute || 0.40; // Default fallback
                    let isBlockedActive = false;
                    const durationSec = Math.floor((Date.now() - session.startTime) / 1000);

                    // Handle Blocked Session Logic
                    if (session.isBlocked === true || session.isBlocked === "true") {
                        if (Date.now() >= session.blockEnd) {
                            // Block ended naturally!
                            console.log(`[Billing] Block session in room ${roomId} ended naturally.`);
                            
                            const bonus = parseFloat(session.blockGain || settings.blockModelGain || 25);
                            await redis.incrbyfloat(`model:${session.modelId}:balance`, bonus);
                            await redis.incrbyfloat(`model:${session.modelId}:total_gains`, bonus);
                            session.earnedUsd = (session.earnedUsd || 0) + bonus;
                            
                            await logModelPayout(bonus);
                            
                            // Reset block status
                            session.isBlocked = false;
                            delete session.blockEnd;
                            delete session.blockGain;
                            delete session.blockCreditsCost;
                            delete session.blockDurationMin;
                            
                            // IMMEDIATELY notify about the new payout total before ending the block
                            if (ioInstance) {
                                ioInstance.to(roomId).emit('payout_update', { 
                                    rate: activeRate, 
                                    earned: session.earnedUsd || 0,
                                    durationSec
                                });
                                ioInstance.to(roomId).emit('block_session_ended');
                            }
                            // Will proceed with normal rates below
                        } else {
                            isBlockedActive = true;
                            // Fixed rate: totalCredits / totalSeconds
                            const totalCredits = parseFloat(session.blockCreditsCost || settings.blockCreditsCost || 600);
                            const durationMin = parseInt(session.blockDurationMin || settings.blockDurationMin || 30);
                            const totalSecs = durationMin * 60;
                            
                            // Ensure the rate is calculated dynamically from settings
                            rateUserCreditsPerSec = totalCredits / totalSecs;
                            
                            // FORCE model rate to 0
                            activeRate = 0;
                        }
                    }

                    if (!isBlockedActive) {
                        rateUserCreditsPerSec = 10 / 60.0;
                        
                        // Calculate dynamic Model Payout Tier
                        const durationMin = durationSec / 60.0;
                        
                        if (settings.payoutTiers && settings.payoutTiers.length > 0) {
                            const tiers = [...settings.payoutTiers].sort((a, b) => b.minMinutes - a.minMinutes);
                            const activeTier = tiers.find(t => durationMin >= t.minMinutes);
                            if (activeTier) {
                                activeRate = activeTier.rate;
                            }
                        }
                    }
                    
                    const isActuallyBlocked = isBlockedActive || session.isBlocked === true || session.isBlocked === "true";
                    const rateModelUsdPerSec = isActuallyBlocked ? 0 : parseFloat((activeRate / 60.0).toFixed(6));

                    // 2. Decrement User Credits
                    let remaining = 0;
                    if (session.userId.includes('@')) {
                        remaining = await redis.incrbyfloat(`user:${session.userId}:credits`, -rateUserCreditsPerSec);
                        
                        if (ioInstance) {
                            ioInstance.to(roomId).emit('credits_update', Math.max(0, remaining));
                        }

                        if (remaining <= 0) {
                            if (remaining < 0) await redis.set(`user:${session.userId}:credits`, 0);
                            if (ioInstance) {
                                ioInstance.to(roomId).emit('out_of_credits', { reason: 'balance_exhausted' });
                                ioInstance.to(roomId).emit('partner_out_of_credits');
                            }
                            await stopBilling(roomId);
                            continue;
                        }
                    } else {
                        // Guest user: increment time used (no block logic for guests usually, but we keep it safe)
                        const used = await redis.incrby(`free_secs:${session.userId}`, 1);
                        remaining = 30 - used;
                        if (ioInstance) {
                            ioInstance.to(roomId).emit('credits_update', Math.max(0, remaining));
                        }
                        if (used >= 30) {
                            if (ioInstance) {
                                ioInstance.to(roomId).emit('out_of_credits', { reason: 'guest_limit_reached' });
                                ioInstance.to(roomId).emit('partner_out_of_credits');
                            }
                            await stopBilling(roomId);
                            continue;
                        }
                    }
                    session.spentCredits = (session.spentCredits || 0) + rateUserCreditsPerSec;

                    // 3. Increment Model Earnings (Only if not blocked)
                    if (!isBlockedActive && durationSec > settings.antiFraudDelaySec) {
                        await redis.incrbyfloat(`model:${session.modelId}:balance`, rateModelUsdPerSec);
                        await redis.incrbyfloat(`model:${session.modelId}:total_gains`, rateModelUsdPerSec);
                        session.earnedUsd = (session.earnedUsd || 0) + rateModelUsdPerSec;
                    }

                    // Update session state in Redis
                    await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));

                    // 4. Sync Payout Info to Model
                    if (ioInstance) {
                        ioInstance.to(roomId).emit('payout_update', { 
                            rate: activeRate, 
                            earned: session.earnedUsd || 0,
                            durationSec
                        });
                    }

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
    
    // Map User identifier to current Room ID for reconnection
    await redis.set(`user_active_room:${String(userId).toLowerCase()}`, roomId, 'EX', 3600);
    await redis.set(`user_active_room:${String(modelId).toLowerCase()}`, roomId, 'EX', 3600);

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

    // --- NEW: Cleanup Recovery Pointers ---
    await redis.del(`user_active_room:${userId}`);
    await redis.del(`user_active_room:${modelId}`);

    // We use the EXACT accumulated value from the session ticks
    const modelEarned = (session.earnedUsd || 0);
    const userSpentCredits = (session.spentCredits || 0);
    const userSpentUsd = parseFloat(userSpentCredits) / 10.0;
    
    let totalModelEarned = parseFloat(session.earnedUsd || 0);
    let privateEarned = 0;

    if (session.isBlocked) {
        const { getSettings } = require('./settings');
        const settings = await getSettings();
        privateEarned = parseFloat(session.blockGain || settings.blockModelGain || 25);
        console.log(`[Billing] Applying blockGain $${privateEarned} for intentional stop in room ${roomId}`);
        await redis.incrbyfloat(`model:${modelId}:balance`, privateEarned);
        await redis.incrbyfloat(`model:${modelId}:total_gains`, privateEarned);
        await logModelPayout(privateEarned);
        totalModelEarned += privateEarned;
    }
    
    const normalEarned = totalModelEarned - privateEarned;

    if (parseFloat(totalModelEarned) > 0 || parseFloat(userSpentCredits) > 0 || session.isBlocked) {
        await logRevenue(userSpentUsd);
        await logModelPayout(parseFloat(normalEarned));
        await redis.incrbyfloat(`model:${modelId}:balance`, 0); // Trigger balance sync if needed
        await redis.incrbyfloat(`user:${userId}:total_spent`, userSpentUsd);
        
        const historyEntry = {
            roomId,
            userId,
            modelId,
            durationSec,
            modelEarned: parseFloat(totalModelEarned.toFixed(2)),
            normalEarned: parseFloat(normalEarned.toFixed(2)),
            privateEarned: parseFloat(privateEarned.toFixed(2)),
            isPrivate: !!privateEarned,
            userSpentCredits: parseFloat(userSpentCredits),
            timestamp: Date.now()
        };

        await redis.lpush(`model:${modelId}:history`, JSON.stringify(historyEntry));
        await redis.lpush(`user:${userId}:history`, JSON.stringify(historyEntry));

        // Mark as seen if call lasted > 15 seconds (Anti-Rebound)
        if (durationSec > 15) {
            await markAsSeen(userId, modelId);
        }

        // Clean up reconnection mappings
        await redis.del(`user_active_room:${userId}`);
        await redis.del(`user_active_room:${modelId}`);
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
