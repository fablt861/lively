const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Production DB URL from .env
const DATABASE_URL = "postgresql://neondb_owner:npg_CM3R1EroOhDf@ep-young-resonance-amvczhuk-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runMigration() {
    console.log('--- Starting Production Database Migration ---');
    console.log('Checking connection...');
    
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('[Postgres] Connected to production database.');

        const sqlPath = path.join(__dirname, '..', 'database', 'production_migration_20260415.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL migration...');
        await client.query(sql);
        console.log('[Postgres] Migration successful!');

    } catch (err) {
        console.error('[Postgres] Migration failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
}

runMigration();
