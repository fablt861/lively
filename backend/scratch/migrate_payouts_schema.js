const { query } = require('./db');
async function migrateSchema() {
    try {
        console.log('Adding model_id to payouts table...');
        await query('ALTER TABLE payouts ADD COLUMN IF NOT EXISTS model_id UUID');
        
        console.log('Populating model_id from models table based on email...');
        await query(`
            UPDATE payouts p
            SET model_id = m.id
            FROM models m
            WHERE p.model_email = m.email
            AND p.model_id IS NULL
        `);
        
        console.log('Schema migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}
migrateSchema();
