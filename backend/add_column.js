require('dotenv').config();
const { Pool } = require('pg');

async function run() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS void_approvers JSONB DEFAULT '["owner", "manager"]'::jsonb;`);
        console.log('Column void_approvers added successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
