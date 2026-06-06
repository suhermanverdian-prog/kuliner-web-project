require('dotenv').config();
const { Pool } = require('pg');

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing in .env");
        process.exit(1);
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        console.log('Adding subscription billing columns to tenants table...');
        await pool.query(`
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) DEFAULT 'monthly';
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'paid';
        `);
        console.log('Columns added successfully.');

        // Let's also create a subscription_billing_logs table for payment history
        console.log('Creating tenant_billing_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tenant_billing_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                amount NUMERIC(15, 2) NOT NULL,
                billing_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'success',
                invoice_number VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('tenant_billing_logs table verified/created successfully.');
    } catch (e) {
        console.error('Error executing migration:', e);
    } finally {
        pool.end();
    }
}
run();
