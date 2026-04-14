const { Pool } = require('pg');

// Staging PG URL from previous research
const PG_URL = "postgresql://neondb_owner:npg_lr4iM9nTWZst@ep-autumn-wildflower-am3vckpq-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function initFavorites() {
    console.log('--- Initializing Favorites Table on STAGING ---');
    
    const pool = new Pool({ 
        connectionString: PG_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('[Postgres] Creating favorites table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
                model_email VARCHAR(255) REFERENCES models(email) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, model_email)
            );
        `);
        
        console.log('[Postgres] Creating indices...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_favorites_user_email ON favorites(user_email);
        `);

        console.log('[SUCCESS] Favorites table initialized on Staging.');
    } catch (err) {
        console.error('[ERROR] Initialization failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

initFavorites();
