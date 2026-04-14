const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_lr4iM9nTWZst@ep-young-resonance-amvczhuk.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function check() {
    try {
        const models = await pool.query('SELECT email FROM models');
        const users = await pool.query('SELECT email FROM users');
        
        console.log('--- Models in DB ---');
        console.log(models.rows.map(m => m.email));
        
        console.log('\n--- Users in DB ---');
        console.log(users.rows.map(u => u.email));
        
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await pool.end();
    }
}

check();
