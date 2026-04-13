const { getRedisClient } = require('../redis');
const { query, pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('--- Starting Migration: Redis -> PostgreSQL ---');
    
    // 1. Initialize Schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    try {
        await query(schema);
        console.log('[Postgres] Schema initialized successfully.');
    } catch (err) {
        console.error('[Postgres] Failed to initialize schema:', err);
        process.exit(1);
    }

    const redis = getRedisClient();

    // 2. Migrate Models
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
                    ON CONFLICT (email) DO NOTHING
                `, [
                    email, m.password, m.pseudo, m.firstName, m.lastName, 
                    m.dob ? new Date(m.dob) : null, m.phone, m.country, 
                    m.photoProfile, m.photoId, m.photoIdSelfie, m.lang || 'en', m.status || 'active',
                    m.marketing?.src, m.marketing?.camp, m.marketing?.ad,
                    m.registeredAt ? new Date(m.registeredAt) : new Date()
                ]);
                
                // Migrate balances separately
                const balance = await redis.get(`model:${email}:balance`) || '0';
                await query('UPDATE models SET balance = $1 WHERE email = $2', [parseFloat(balance), email]);
                
                console.log(`[Migrated] Model: ${email}`);
            } catch (err) {
                console.error(`[Error] Migrating model ${email}:`, err.message);
            }
        }
    }

    // 3. Migrate Users
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
                    ON CONFLICT (email) DO NOTHING
                `, [
                    email, u.password, u.pseudo, u.status || 'active',
                    u.marketing?.src, u.marketing?.camp, u.marketing?.ad,
                    u.registeredAt ? new Date(u.registeredAt) : new Date()
                ]);
                
                // Migrate credits
                const credits = await redis.get(`user:${email}:credits`) || '0';
                await query('UPDATE users SET credits = $1 WHERE email = $2', [parseFloat(credits), email]);
                
                console.log(`[Migrated] User: ${email}`);
            } catch (err) {
                console.error(`[Error] Migrating user ${email}:`, err.message);
            }
        }
    }

    console.log('--- Migration Completed ---');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
