const { query } = require('./db');
const { getRedisClient } = require('./redis');
const redis = getRedisClient();

/**
 * Ensures Redis has the latest credit balance from Postgres.
 * Called when a user joins the queue or starts a call.
 */
async function hydrateUserCredits(id) {
    if (!id) return 0;
    const redisKey = `user:${id}:credits`;

    // 1. Try Redis first
    const cached = await redis.get(redisKey);
    if (cached !== null) return parseFloat(cached);

    // 2. Fallback to Postgres
    console.log(`[Hydration] Loading credits from Postgres for ID: ${id}`);
    const res = await query('SELECT credits FROM users WHERE id = $1', [id]);
    const credits = res.rows.length > 0 ? parseFloat(res.rows[0].credits) : 0;

    // 3. Update Redis cache (expire in 2 hours of inactivity)
    await redis.set(redisKey, credits.toString(), 'EX', 7200);
    return credits;
}

/**
 * Flushes a completed session's financial data to Postgres.
 */
async function flushSessionToPostgres(userId, modelId, userSpentCredits, modelEarnedUsd) {
    try {
        // 1. Update User Credits in Postgres (Detect if UUID by length or format, or just try query)
        // userId might be an IP for guests. Guests don't have credits in Postgres.
        const isRegisteredUser = userId && userId.length > 15; // Simple heuristic for UUID vs IP

        if (isRegisteredUser && userSpentCredits > 0) {
            const redisKey = `user:${userId}:credits`;
            const currentRedis = await redis.get(redisKey);
            
            const creditsToSet = currentRedis !== null ? parseFloat(currentRedis) : null;
            
            if (creditsToSet !== null) {
                await query('UPDATE users SET credits = $1 WHERE id = $2', [creditsToSet, userId]);
                console.log(`[Sync] Synced user ${userId} credits to Postgres: ${creditsToSet}`);
            }
        }

        // 2. Update Model Balance in Postgres (modelId is always a UUID)
        if (modelId && modelEarnedUsd > 0) {
            const redisKey = `model:${modelId}:balance`;
            const currentRedisBalance = await redis.get(redisKey);
            
            await query(`
                UPDATE models 
                SET balance = $1, 
                    total_earned = total_earned + $2 
                WHERE id = $3
            `, [parseFloat(currentRedisBalance || 0), modelEarnedUsd, modelId]);
            
            console.log(`[Sync] Synced model ${modelId} earnings to Postgres: +$${modelEarnedUsd}`);
        }
    } catch (err) {
        console.error('[Sync Error] Failed to flush to Postgres:', err.message);
    }
}

module.exports = { hydrateUserCredits, flushSessionToPostgres };
