/**
 * Redis Migration Script v2 (UUID Migration)
 * Standardizes Redis keys by renaming them from email-based patterns to UUID-based patterns.
 */

const { getRedisClient } = require('../redis');
const { query } = require('../db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateRedis() {
    const redis = getRedisClient();
    console.log('[Migration] Starting Redis UUID Migration...');

    try {
        // 1. Migrate Users
        console.log('[Users] Fetching users from PostgreSQL...');
        const userRes = await query('SELECT id, email FROM users');
        let userCount = 0;

        for (const user of userRes.rows) {
            const id = user.id;
            const email = user.email.toLowerCase();

            const mappings = [
                { old: `user:${email}:credits`, new: `user:${id}:credits` },
                { old: `user:${email}:last_login`, new: `user:${id}:last_login` },
                { old: `user:${email}:total_spent`, new: `user:${id}:total_spent` },
                { old: `user:${email}:history`, new: `user:${id}:history` },
                { old: `profile:${email}`, new: `profile:${id}` }
            ];

            for (const map of mappings) {
                const exists = await redis.exists(map.old);
                if (exists) {
                    const targetExists = await redis.exists(map.new);
                    if (!targetExists) {
                        try {
                            await redis.rename(map.old, map.new);
                            // console.log(`  [OK] Renames ${map.old} -> ${map.new}`);
                        } catch (err) {
                            console.error(`  [ERR] Failed to rename ${map.old}:`, err.message);
                        }
                    } else {
                        // console.log(`  [SKIP] Target ${map.new} already exists.`);
                    }
                }
            }
            userCount++;
            if (userCount % 100 === 0) console.log(`  Processed ${userCount} users...`);
        }
        console.log(`[Users] Migration complete. Total: ${userCount}`);

        // 2. Migrate Models
        console.log('[Models] Fetching models from PostgreSQL...');
        const modelRes = await query('SELECT id, email FROM models');
        let modelCount = 0;

        for (const model of modelRes.rows) {
            const id = model.id;
            const email = model.email.toLowerCase();

            const mappings = [
                { old: `model:${email}:balance`, new: `model:${id}:balance` },
                { old: `model:${email}:total_gains`, new: `model:${id}:total_gains` },
                { old: `model:${email}:last_login`, new: `model:${id}:last_login` },
                { old: `model:${email}:numeric_id`, new: `model:${id}:numeric_id` },
                { old: `model:${email}:history`, new: `model:${id}:history` },
                { old: `profile:${email}`, new: `profile:${id}` }
            ];

            for (const map of mappings) {
                const exists = await redis.exists(map.old);
                if (exists) {
                    const targetExists = await redis.exists(map.new);
                    if (!targetExists) {
                        try {
                            await redis.rename(map.old, map.new);
                            // console.log(`  [OK] Renames ${map.old} -> ${map.new}`);
                        } catch (err) {
                            console.error(`  [ERR] Failed to rename ${map.old}:`, err.message);
                        }
                    } else {
                        // console.log(`  [SKIP] Target ${map.new} already exists.`);
                    }
                }
            }
            modelCount++;
            if (modelCount % 100 === 0) console.log(`  Processed ${modelCount} models...`);
        }
        console.log(`[Models] Migration complete. Total: ${modelCount}`);

        console.log('[Migration] ALL REDIS KEYS MIGRATED SUCCESSFULLY.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration Error]', err);
        process.exit(1);
    }
}

migrateRedis();
