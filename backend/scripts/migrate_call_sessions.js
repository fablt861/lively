const { query } = require('../db');

async function createTable() {
    try {
        console.log('[Migration] Dropping and Re-creating call_sessions table with all fields...');
        await query(`DROP TABLE IF EXISTS call_sessions CASCADE;`);
        
        await query(`
            CREATE TABLE IF NOT EXISTS call_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                model_id UUID NOT NULL,
                duration_sec INTEGER NOT NULL,
                model_earned DECIMAL(15, 2) DEFAULT 0.00,
                normal_earned DECIMAL(15, 2) DEFAULT 0.00,
                private_earned DECIMAL(15, 2) DEFAULT 0.00,
                is_private BOOLEAN DEFAULT FALSE,
                user_spent_credits DECIMAL(15, 2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('[Migration] Creating indices for call_sessions...');
        await query(`CREATE INDEX IF NOT EXISTS idx_call_sessions_user_model ON call_sessions(user_id, model_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_call_sessions_model_history ON call_sessions(model_id, created_at DESC);`);
        
        console.log('[Migration] Table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[Migration Error]', err);
        process.exit(1);
    }
}

createTable();
