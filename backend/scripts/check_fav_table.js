const { query } = require('./db');

async function checkTable() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'favorites'
        `);
        console.log('Favorites Table Columns:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error checking table:', err);
    }
    process.exit(0);
}

checkTable();
