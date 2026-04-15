const { query } = require('../backend/db');

async function listAllTables() {
    try {
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in DB:', tables.rows.map(r => r.table_name).join(', '));
        
        for (const table of tables.rows.map(r => r.table_name)) {
            const cols = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            console.log(`- ${table}: ${cols.rows.map(c => c.column_name).join(', ')}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listAllTables();
