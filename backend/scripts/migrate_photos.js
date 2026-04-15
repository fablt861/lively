const { query } = require('../db');

async function migrate() {
    try {
        console.log('[Migration] Adding photo_profile_reg to models table...');
        // 1. Add column if not exists
        await query(`
            ALTER TABLE models 
            ADD COLUMN IF NOT EXISTS photo_profile_reg TEXT;
        `);

        // 2. Backfill for existing models
        console.log('[Migration] Backfilling photo_profile_reg with current photo_profile...');
        await query(`
            UPDATE models 
            SET photo_profile_reg = photo_profile 
            WHERE photo_profile_reg IS NULL;
        `);

        console.log('[Migration] Successfully updated models table.');
    } catch (err) {
        console.error('[Migration Error]', err);
    } finally {
        process.exit();
    }
}

migrate();
