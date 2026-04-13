const { query } = require('./db');
const { getRedisClient } = require('./redis');
const redis = getRedisClient();

/**
 * Ensures Redis has the latest credit balance from Postgres.
 * Called when a user joins the queue or starts a call.
 */
async function hydrateUserCredits(email) {
    if (!email) return 0;
    const normalizedEmail = email.toLowerCase();
    const redisKey = `user:${normalizedEmail}:credits`;

    // 1. Try Redis first
    const cached = await redis.get(redisKey);
    if (cached !== null) return parseFloat(cached);

    // 2. Fallback to Postgres
    console.log(`[Hydration] Loading credits from Postgres for ${normalizedEmail}`);
    const res = await query('SELECT credits FROM users WHERE email = $1', [normalizedEmail]);
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
        // 1. Update User Credits in Postgres
        if (userId && userId.includes('@') && userSpentCredits > 0) {
            const redisKey = `user:${userId.toLowerCase()}:credits`;
            const currentRedis = await redis.get(redisKey);
            
            // source of truth is the current redis value if available
            const creditsToSet = currentRedis !== null ? parseFloat(currentRedis) : null;
            
            if (creditsToSet !== null) {
                await query('UPDATE users SET credits = $1 WHERE email = $2', [creditsToSet, userId.toLowerCase()]);
                console.log(`[Sync] Synced user ${userId} credits to Postgres: ${creditsToSet}`);
            }
        }

        // 2. Update Model Balance in Postgres
        if (modelId && modelId.includes('@') && modelEarnedUsd > 0) {
            const normalizedModelId = modelId.toLowerCase();
            const redisKey = `model:${normalizedModelId}:balance`;
            const currentRedisBalance = await redis.get(redisKey);
            
            // For models, we also update total_earned
            await query(`
                UPDATE models 
                SET balance = $1, 
                    total_earned = total_earned + $2 
                WHERE email = $3
            `, [parseFloat(currentRedisBalance || 0), modelEarnedUsd, normalizedModelId]);
            
            console.log(`[Sync] Synced model ${modelId} earnings to Postgres: +$${modelEarnedUsd}`);
        }
    } catch (err) {
        console.error('[Sync Error] Failed to flush to Postgres:', err.message);
    }
}

module.exports = { hydrateUserCredits, flushSessionToPostgres };
