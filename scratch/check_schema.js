const { query } = require('../backend/db');

async function checkDetailedSchema() {
    try {
        console.log('--- USERS ---');
        const users = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`);
        users.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- MODELS ---');
        const models = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'models'`);
        models.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- CALLS ---');
        const calls = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'calls'`);
        calls.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- TRANSACTIONS / PAYMENTS ---');
        const tables = await query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        const tableNames = tables.rows.map(r => r.table_name);
        
        const transTable = tableNames.find(t => t.includes('transaction') || t.includes('payment') || t.includes('purchase'));
        if (transTable) {
            console.log(`Table found: ${transTable}`);
            const trans = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${transTable}'`);
            trans.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        } else {
            console.log('No transaction/payment table found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDetailedSchema();
