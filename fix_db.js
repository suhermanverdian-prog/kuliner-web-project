require('dotenv').config({path: './backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const q = `
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS kds_status VARCHAR DEFAULT 'new';
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cashier_name VARCHAR;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS table_type VARCHAR;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cash_received NUMERIC;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS change NUMERIC;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
  `;
  // Actually, Supabase has an issue with executing raw SQL via js client unless rpc is defined.
  // Wait! We can use standard PostgreSQL client!
}
run();
