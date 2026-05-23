const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  const tables = ['suppliers', 'purchase_orders', 'grns', 'purchase_invoices', 'purchase_payments', 'shifts', 'audit_logs'];
  console.log('Checking Supabase tables...');
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: EXISTS (${data.length} records)`);
    }
  }
}

check();
