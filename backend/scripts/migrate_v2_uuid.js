const { Pool } = require('pg');

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Starting UUID Migration ---');
        await client.query('BEGIN');

        // 1. Add id column to users if not exists
        console.log('Updating users table...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
        `);

        // 2. Add id column to models if not exists
        console.log('Updating models table...');
        await client.query(`
            ALTER TABLE models ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
        `);

        // 3. Ensure favorites table exists
        console.log('Checking favorites table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
                model_email VARCHAR(255) REFERENCES models(email) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, model_email)
            );
        `);

        console.log('Updating favorites columns...');
        await client.query(`
            ALTER TABLE favorites ADD COLUMN IF NOT EXISTS user_id UUID;
            ALTER TABLE favorites ADD COLUMN IF NOT EXISTS model_id UUID;
        `);

        // Re-populate favorites from emails
        const favsRaw = await client.query('SELECT user_email, model_email FROM favorites');
        if (favsRaw.rows.length > 0) {
            console.log(`Migrating ${favsRaw.rows.length} favorites...`);
            for (const row of favsRaw.rows) {
                const userRes = await client.query('SELECT id FROM users WHERE email = $1', [row.user_email]);
                const modelRes = await client.query('SELECT id FROM models WHERE email = $1', [row.model_email]);
                
                if (userRes.rows.length > 0 && modelRes.rows.length > 0) {
                    await client.query(
                        'UPDATE favorites SET user_id = $1, model_id = $2 WHERE user_email = $3 AND model_email = $4',
                        [userRes.rows[0].id, modelRes.rows[0].id, row.user_email, row.model_email]
                    );
                }
            }
        }

        // 4. Update payouts table
        console.log('Updating payouts table...');
        await client.query(`
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS model_id UUID;
        `);

        const payoutsRaw = await client.query('SELECT model_email FROM payouts');
        if (payoutsRaw.rows.length > 0) {
            console.log(`Migrating ${payoutsRaw.rows.length} payouts...`);
            for (const row of payoutsRaw.rows) {
                const modelRes = await client.query('SELECT id FROM models WHERE email = $1', [row.model_email]);
                if (modelRes.rows.length > 0) {
                    await client.query(
                        'UPDATE payouts SET model_id = $1 WHERE model_email = $2',
                        [modelRes.rows[0].id, row.model_email]
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log('--- Migration Successful ---');
    } catch (err) {
        await client.query('ROLLBACK');
        console.log('--- Migration Failed ---');
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
