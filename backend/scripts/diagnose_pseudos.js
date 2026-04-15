const { query } = require('../db');
const { getRedisClient } = require('../redis');
require('dotenv').config();

async function diagnose() {
    const redis = getRedisClient();
    console.log('[Diagnosis] Starting Pseudo Consistency Check...');
    
    try {
        // 1. Fetch all identities from Postgres
        const sqlRes = await query(`
            SELECT id, email, pseudo, 'user' as role FROM users
            UNION
            SELECT id, email, pseudo, 'model' as role FROM models
        `);
        
        const instances = sqlRes.rows;
        console.log(`[Diagnosis] Found ${instances.length} accounts in SQL database.`);
        console.log('------------------------------------------------------------');
        
        let mismatches = 0;
        let missing = 0;
        
        for (const account of instances) {
            const id = account.id;
            const email = account.email.toLowerCase();
            const sqlPseudo = account.pseudo || 'NULL';
            
            // Fetch from Redis
            const redisPseudo = await redis.hget(`profile:${id}`, 'pseudo');
            
            if (!redisPseudo) {
                console.log(`[MISSING] ${id} (${email}) | SQL: ${sqlPseudo} | Redis: (Not in cache)`);
                missing++;
            } else if (redisPseudo !== account.pseudo) {
                console.log(`[MISMATCH] ${id} (${email}) | SQL: ${sqlPseudo} | Redis: ${redisPseudo}`);
                mismatches++;
            }
        }
        
        console.log('------------------------------------------------------------');
        console.log(`[Diagnosis Complete]`);
        console.log(`- Mismatches found: ${mismatches}`);
        console.log(`- Missing in Redis: ${missing}`);
        console.log(`- Total inconsistencies: ${mismatches + missing}`);
        
    } catch (err) {
        console.error('[Diagnosis Error]', err);
    } finally {
        process.exit();
    }
}

diagnose();
