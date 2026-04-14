const Redis = require('ioredis');
const { Pool } = require('pg');

// Remote Credentials
const REDIS_URL = "rediss://default:gQAAAAAAAUj5AAIncDE2OTk1ZmM0MzQ4ZGU0NTE3OWY1ZGU4MmVlZDM0MTdmOXAxODQyMTc@assured-dane-84217.upstash.io:6379";
const PG_URL = "postgresql://neondb_owner:npg_lr4iM9nTWZst@ep-autumn-wildflower-am3vckpq-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runRemoteMigration() {
    console.log('--- Starting Remote Migration (STAGING) ---');
    
    const redis = new Redis(REDIS_URL);
    console.log('[Redis] Connected to remote Upstash');

    const pool = new Pool({ 
        connectionString: PG_URL,
        ssl: { rejectUnauthorized: false }
    });
    const query = (text, params) => pool.query(text, params);
    console.log('[Postgres] Connected to remote Neon (Staging)');

    // 1. Migrate Models
    console.log('Migrating models...');
    const modelKeys = await redis.keys('model:active:*');
    for (const key of modelKeys) {
        const data = await redis.get(key);
        if (data) {
            const m = JSON.parse(data);
            const email = key.replace('model:active:', '');
            
            try {
                await query(`
                    INSERT INTO models (
                        email, password, pseudo, first_name, last_name, dob, phone, country, 
                        photo_profile, photo_id, photo_id_selfie, lang, status, marketing_src, 
                        marketing_camp, marketing_ad, registered_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (email) DO UPDATE SET
                        password = EXCLUDED.password,
                        status = EXCLUDED.status
                `, [
                    email, m.password, m.pseudo, m.firstName, m.lastName, 
                    m.dob ? new Date(m.dob) : null, m.phone, m.country, 
                    m.photoProfile, m.photoId, m.photoIdSelfie, m.lang || 'en', m.status || 'active',
                    m.marketing?.src, m.marketing?.camp, m.marketing?.ad,
                    m.registeredAt ? new Date(m.registeredAt) : new Date()
                ]);
                
                const balance = await redis.get(`model:${email}:balance`) || '0';
                await query('UPDATE models SET balance = $1 WHERE email = $2', [parseFloat(balance), email]);
                
                console.log(`[Migrated] Model: ${email}`);
            } catch (err) {
                console.error(`[Error] Migrating model ${email}:`, err.message);
            }
        }
    }

    // 2. Migrate Users
    console.log('Migrating users...');
    const userKeys = await redis.keys('user:active:*');
    for (const key of userKeys) {
        const data = await redis.get(key);
        if (data) {
            const u = JSON.parse(data);
            const email = key.replace('user:active:', '');
            
            try {
                await query(`
                    INSERT INTO users (
                        email, password, pseudo, status, marketing_src, 
                        marketing_camp, marketing_ad, registered_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (email) DO UPDATE SET
                        password = EXCLUDED.password,
                        status = EXCLUDED.status
                `, [
                    email, u.password, u.pseudo, u.status || 'active',
                    u.marketing?.src, u.marketing?.camp, u.marketing?.ad,
                    u.registeredAt ? new Date(u.registeredAt) : new Date()
                ]);
                
                const credits = await redis.get(`user:${email}:credits`) || '0';
                await query('UPDATE users SET credits = $1 WHERE email = $2', [parseFloat(credits), email]);
                
                console.log(`[Migrated] User: ${email}`);
            } catch (err) {
                console.error(`[Error] Migrating user ${email}:`, err.message);
            }
        }
    }

    console.log('--- Remote Migration Completed ---');
    redis.disconnect();
    await pool.end();
    process.exit(0);
}

runRemoteMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
