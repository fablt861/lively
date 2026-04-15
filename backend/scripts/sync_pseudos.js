const { query } = require('../db');
const { getRedisClient } = require('../redis');
require('dotenv').config();

async function sync() {
    const redis = getRedisClient();
    console.log('[Sync] Starting Pseudo Synchronization (SQL -> Redis)...');
    
    try {
        const sqlRes = await query(`
            SELECT email, pseudo, NULL as first_name, NULL as last_name, 'user' as role FROM users
            UNION
            SELECT email, pseudo, first_name, last_name, 'model' as role FROM models
        `);
        
        const instances = sqlRes.rows;
        console.log(`[Sync] Found ${instances.length} accounts to synchronize.`);
        
        let updated = 0;
        
        for (const account of instances) {
            const email = account.email.toLowerCase();
            const pseudo = account.pseudo || (account.first_name ? `${account.first_name} ${account.last_name || ''}`.trim() : null) || email.split('@')[0];
            
            await redis.hset(`profile:${email}`, 'pseudo', pseudo);
            console.log(`[OK] Synced ${email} -> ${pseudo}`);
            updated++;
        }
        
        console.log('------------------------------------------------------------');
        console.log(`[Sync Complete] Total accounts updated in Redis: ${updated}`);
        
    } catch (err) {
        console.error('[Sync Error]', err);
    } finally {
        process.exit();
    }
}

sync();
