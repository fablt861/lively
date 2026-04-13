const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/lively',
});

// Test connection
pool.on('connect', () => {
    console.log('[Postgres] Client connected to pool');
});

pool.on('error', (err) => {
    console.error('[Postgres] Unexpected error on idle client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
