const { getRedisClient } = require('./redis');
const redis = getRedisClient();

const { getSettings } = require('./settings');
const { markAsSeen } = require('./moderation');
const { logRevenue, logModelPayout } = require('./stats');
const { query } = require('./db');
const { flushSessionToPostgres } = require('./balance');

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
                    // 1. Verify room presence (Optimized: Local check then Global fallback)
                    if (ioInstance) {
                        let hasUser = false;
                        let hasModel = false;

                        // FAST PATH: Check local server instance first
                        const localRoom = ioInstance.sockets.adapter.rooms.get(roomId);
                        if (localRoom && localRoom.size >= 2) {
                            const localSockets = Array.from(localRoom).map(id => ioInstance.sockets.sockets.get(id)).filter(Boolean);
                            hasUser = localSockets.some(s => s.data?.role === 'user' || s.id === session.userSocketId);
                            hasModel = localSockets.some(s => s.data?.role === 'model' || s.id === session.modelSocketId);
                        }

                        // SLOW PATH: If one is missing locally, check all servers in the cluster (Render/Vercel safe)
                        if (!hasUser || !hasModel) {
                            const globalSockets = await ioInstance.in(roomId).fetchSockets();
                            hasUser = globalSockets.some(s => (s.data?.role === 'user' || s.id === session.userSocketId));
                            hasModel = globalSockets.some(s => (s.data?.role === 'model' || s.id === session.modelSocketId));
                        }

                        if (!hasUser || !hasModel) {
                            // Give it a 10-second grace period before closing (Reduces ghost billing)
                            session.emptyTicks = (session.emptyTicks || 0) + 1;
                            const missingRole = !hasUser ? 'USER' : 'MODEL';
                            
                            // Debug log for troubleshooting why billing might skip
                            if (session.emptyTicks % 5 === 0) {
                                console.log(`[Billing Grace] Room ${roomId} missing ${missingRole}. Sockets in room:`, (await ioInstance.in(roomId).fetchSockets()).map(s => `${s.id}:${s.data?.role || 'null'}`));
                            }
                            
                            if (session.emptyTicks >= 10) {
                                console.log(`[Billing] Room ${roomId} missing person for 10s. Auto-closing.`);
                                await stopBilling(roomId, 'disconnect_timeout');
                            } else {
                                await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));
                            }
                            continue; // Skip billing for this tick
                        } else {
                            // Both parties present, reset grace period
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

                    // CHECK SEPARATE BLOCK KEY (Race condition relief)
                    const blockDataRaw = await redis.get(`billing:is_blocked:${roomId}`);
                    let blockData = blockDataRaw ? JSON.parse(blockDataRaw) : null;
                    
                    // Fallback to session check if separate key is missing (for legacy or just-in-case)
                    if (!blockData && (session.isBlocked === true || session.isBlocked === "true")) {
                        blockData = {
                            blockEnd: session.blockEnd,
                            blockGain: session.blockGain,
                            blockCreditsCost: session.blockCreditsCost,
                            blockDurationMin: session.blockDurationMin
                        };
                    }

                    // Handle Blocked Session Logic
                    if (blockData) {
                        const blockEndNum = Number(blockData.blockEnd);
                        if (Date.now() >= blockEndNum) {
                            // Block ended naturally!
                            console.log(`[Billing] Block session in room ${roomId} ended naturally. Transitioning back to normal billing.`);
                            await transitionFromBlock(roomId, session, blockData);
                            continue;
                        } else {
                            isBlockedActive = true;
                            // Fixed rate: totalCredits / totalSeconds
                            const totalCredits = parseFloat(blockData.blockCreditsCost || settings.blockCreditsCost || 600);
                            const durationMin = parseInt(blockData.blockDurationMin || settings.blockDurationMin || 30);
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
                    
                    const isActuallyBlocked = isBlockedActive || !!blockData;
                    const rateModelUsdPerSec = isActuallyBlocked ? 0 : parseFloat((activeRate / 60.0).toFixed(6));

                    // 2. Decrement User Credits
                    let remaining = 0;
                    const isRegisteredUser = session.userId && session.userId.length > 20; // UUID vs IP heuristic
 
                    if (isRegisteredUser) {
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
                        
                        // RESTRICTED COUNTRY LOGIC
                        const isRestricted = settings.restrictedCountries && settings.restrictedCountries.includes(session.userCountryCode);
                        const limit = isRestricted ? 0 : 30; // 0 seconds for restricted countries
                        
                        remaining = limit - used;
                        if (ioInstance) {
                            ioInstance.to(roomId).emit('credits_update', Math.max(0, remaining));
                        }
                        if (used >= limit) {
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
                        const currentBalance = await redis.get(`model:${session.modelId}:balance`);
                        ioInstance.to(roomId).emit('payout_update', { 
                            rate: activeRate, 
                            earned: session.earnedUsd || 0,
                            totalBalance: parseFloat(currentBalance || 0),
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

async function startBilling(roomId, userId, modelId, userSocketId, modelSocketId, userCountryCode = 'Unknown') {
    // Safety: Ensure no stale block data exists for this roomId (Defense-in-depth)
    await redis.del(`billing:is_blocked:${roomId}`);
    await redis.del(`billing:is_blocked_pending:${roomId}`);

    const normalizedUserId = String(userId).toLowerCase();
    const normalizedModelId = String(modelId).toLowerCase();

    // Kill any existing sessions for this user/model to prevent double-billing
    const oldUserRoom = await redis.get(`user_active_room:${normalizedUserId}`);
    if (oldUserRoom && oldUserRoom !== roomId) {
        console.log(`[Billing Guard] Killing stray user session ${oldUserRoom} for ${normalizedUserId}`);
        await stopBilling(oldUserRoom);
    }
    const oldModelRoom = await redis.get(`user_active_room:${normalizedModelId}`);
    if (oldModelRoom && oldModelRoom !== roomId) {
        console.log(`[Billing Guard] Killing stray model session ${oldModelRoom} for ${normalizedModelId}`);
        await stopBilling(oldModelRoom);
    }

    const sessionData = JSON.stringify({ 
        userId: normalizedUserId, 
        modelId: normalizedModelId, 
        userSocketId,
        modelSocketId,
        startTime: Date.now(),
        earnedUsd: 0,
        spentCredits: 0,
        userCountryCode
    });
    await redis.hset(ACTIVE_ROOMS_KEY, roomId, sessionData);
    
    // Map User identifier to current Room ID for reconnection
    await redis.set(`user_active_room:${String(userId).toLowerCase()}`, roomId, 'EX', 3600);
    await redis.set(`user_active_room:${String(modelId).toLowerCase()}`, roomId, 'EX', 3600);

    await redis.lpush('debug:billing', JSON.stringify({ event: 'start', roomId, userId, modelId, timestamp: Date.now() }));
    console.log(`[Billing] Started for room ${roomId}. User: ${userId}, Model: ${modelId}`);
    // Loop is already running globally if initialized via server.js
}

async function stopBilling(roomId, reason = 'unknown') {
    try {
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
    
    // 4. Check if it's a private session (block)
    const blockDataRaw = await redis.get(`billing:is_blocked:${roomId}`);
    const blockData = blockDataRaw ? JSON.parse(blockDataRaw) : null;
    
    let totalModelEarned = parseFloat(session.earnedUsd || 0);
    let privateEarned = 0;

    const isUserQuit = reason.startsWith('user_') || reason === 'balance_exhausted';
    const isModelQuit = reason.startsWith('model_');
    const isTimerEnded = reason === 'timer_ended';

    if (blockData || session.isBlocked) {
        const { getSettings } = require('./settings');
        const settings = await getSettings();
        const totalBlockGain = parseFloat(blockData?.blockGain || session?.blockGain || settings.blockModelGain || 25);
        const totalBlockSec = (parseInt(blockData?.blockDurationMin || session?.blockDurationMin || settings.blockDurationMin || 30)) * 60;
        
        // Prorated payout if user left or timer ended
        const blockStart = blockData?.blockStartTime || session?.startTime || Date.now();
        const elapsedSinceBlockStart = Math.max(0, (Date.now() - blockStart) / 1000);
        const actualPrivateDuration = Math.min(totalBlockSec, elapsedSinceBlockStart);
        
        if (isModelQuit) {
            privateEarned = 0;
            console.log(`[Billing] Model left early. Awarding $0 for block in room ${roomId}`);
        } else {
            privateEarned = parseFloat(((actualPrivateDuration / totalBlockSec) * totalBlockGain).toFixed(4));
            console.log(`[Billing] Private session ended (${reason}). Prorated gain: $${privateEarned} / $${totalBlockGain}`);
        }

        await redis.incrbyfloat(`model:${modelId}:balance`, privateEarned);
        await redis.incrbyfloat(`model:${modelId}:total_gains`, privateEarned);
        
        // Notify model about the summary
        if (ioInstance) {
            ioInstance.to(roomId).emit('private_session_summary', {
                reason,
                earned: privateEarned,
                totalPossible: totalBlockGain,
                durationSec: Math.floor(actualPrivateDuration)
            });
        }

        totalModelEarned += privateEarned;
        await redis.del(`billing:is_blocked:${roomId}`);
    }
    
    const normalEarned = totalModelEarned - privateEarned;

    if (parseFloat(totalModelEarned) > 0 || parseFloat(userSpentCredits) > 0 || session.isBlocked) {
        await logRevenue(userSpentUsd);
        await logModelPayout(parseFloat(totalModelEarned));
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

        // Notify BOTH parties that the call is officially over from the server's perspective
        // (WORKS globally with ioInstance.to(roomId))
        if (ioInstance) {
            console.log(`[Billing] Emitting partner_left to room ${roomId} (Reason: ${reason})`);
            ioInstance.to(roomId).emit('partner_left', { reason });
        }
    }

    // Final Sync to Postgres (Source of Truth)
    await flushSessionToPostgres(userId, modelId, userSpentCredits, totalModelEarned);

    await redis.lpush('debug:billing', JSON.stringify({ event: 'stop', roomId, userId, modelId, durationSec, modelEarned: totalModelEarned, timestamp: Date.now() }));
    console.log(`[Billing] Stopped room ${roomId}. Duration: ${durationSec}s. Earned: $${totalModelEarned.toFixed(2)}`);
    } catch (err) {
        console.error('[Billing Stop Error]', err.message);
    }
}

/**
 * Transition from a private block back to normal billing without stopping the session
 */
async function transitionFromBlock(roomId, session, blockData) {
    try {
        const modelId = String(session.modelId).toLowerCase();
        const userId = String(session.userId).toLowerCase();
        const settings = await getSettings();

        // 1. Calculate Payout (Natural end = Full gain)
        const totalBlockGain = parseFloat(blockData?.blockGain || settings.blockModelGain || 25);
        const durationMin = parseInt(blockData?.blockDurationMin || settings.blockDurationMin || 30);
        
        console.log(`[Billing Transition] Room ${roomId}: Block ended. Crediting model ${modelId} with $${totalBlockGain}`);

        // 2. Credit Model in Redis
        await redis.incrbyfloat(`model:${modelId}:balance`, totalBlockGain);
        await redis.incrbyfloat(`model:${modelId}:total_gains`, totalBlockGain);
        
        // 3. Update Session Object
        session.earnedUsd = (session.earnedUsd || 0) + totalBlockGain;
        // Clean up block flags so normal billing resumes
        delete session.isBlocked;
        delete session.blockEnd;
        delete session.blockGain;
        delete session.blockCreditsCost;
        delete session.blockDurationMin;

        // 4. Clean up Redis block keys
        await redis.del(`billing:is_blocked:${roomId}`);
        await redis.del(`billing:is_blocked_pending:${roomId}`);

        // 5. Save updated session to ACTIVE_ROOMS_KEY
        await redis.hset(ACTIVE_ROOMS_KEY, roomId, JSON.stringify(session));

        // 6. Notify both parties
        if (ioInstance) {
            // Summary for the model (Ok popup)
            ioInstance.to(roomId).emit('private_session_summary', {
                reason: 'timer_ended',
                earned: totalBlockGain,
                totalPossible: totalBlockGain,
                durationSec: durationMin * 60
            });

            // Signal end of block to resume normal UI
            ioInstance.to(roomId).emit('block_session_ended');

            // Force update of displayed balances
            ioInstance.to(roomId).emit('payout_update', { 
                rate: settings.modelPayoutPerMinute || 0.40, 
                earned: session.earnedUsd,
                durationSec: Math.floor((Date.now() - session.startTime) / 1000)
            });
        }

        // 7. Log Partial Payout
        // logModelPayout removed to prevent double-counting when session finally stops
        
        console.log(`[Billing Transition] Room ${roomId}: Successfully transitioned back to normal billing.`);
    } catch (err) {
        console.error(`[Billing Transition Error] Room ${roomId}:`, err.message);
    }
}

async function getModelStats(modelId) {
    const normalizedId = modelId.toLowerCase();
    const balanceStr = await redis.get(`model:${normalizedId}:balance`);
    const historyStrs = await redis.lrange(`model:${normalizedId}:history`, 0, 50);
    
    // FETCH PROFILE FROM SQL (Source of Truth)
    const modelRes = await query('SELECT pseudo, photo_profile FROM models WHERE id = $1', [normalizedId]);
    const profile = modelRes.rows[0] || {};

    return {
        balance: parseFloat(balanceStr || '0'),
        history: historyStrs.map(h => JSON.parse(h)),
        pseudo: profile.pseudo || 'Model',
        photoProfile: profile.photo_profile || ''
    };
}

module.exports = { startBilling, stopBilling, initBillingLoop, getModelStats };
