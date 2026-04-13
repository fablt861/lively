const { query } = require('../db');
const fs = require('fs');
const path = require('path');

async function reset() {
    try {
        console.log('[Postgres] Dropping existing tables...');
        await query('DROP TABLE IF EXISTS payouts, users, models, platform_settings CASCADE');
        
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('[Postgres] Initializing schema with new UUID defaults...');
        await query(schema);
        
        console.log('[Postgres] Database reset successfully.');
    } catch (err) {
        console.error('[Error Resetting DB]', err);
    } finally {
        process.exit();
    }
}

reset();
