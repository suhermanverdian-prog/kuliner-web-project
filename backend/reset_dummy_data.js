require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runReset() {
  console.log("🚀 Starting HARD RESET of transactional data...");

  const tables = [
    'transaction_items',
    'transactions',
    'purchase_order_items',
    'purchase_orders',
    'purchase_invoices',
    'journal_lines',
    'journals'
  ];

  for (const table of tables) {
    try {
      console.log(`Deleting all records from ${table}...`);
      // Use standard delete with a filter that matches all rows
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    } catch (err) {
      console.error(`❌ Exception clearing ${table}:`, err.message);
    }
  }

  console.log("🎉 HARD RESET COMPLETED!");
}

runReset();
