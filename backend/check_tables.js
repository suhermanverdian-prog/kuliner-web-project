require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const tablesToCheck = [
  'tenants', 'users', 'outlets', 'bahan', 'menu', 'menu_bom', 
  'transactions', 'accounts', 'journals', 'journal_lines', 
  'suppliers', 'purchase_orders', 'pembelian', 'pembelian_items', 
  'grns', 'shifts', 'stock_movements'
];

async function checkTables() {
  console.log("=== SUPABASE TABLES AUDIT ===\n");
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`❌ Table [${table}]: MISSING (${error.message})`);
      } else {
        console.log(`⚠️ Table [${table}]: ERROR or RLS BLOCKED (${error.message})`);
      }
    } else {
      const row = data && data.length > 0 ? data[0] : null;
      if (row) {
        console.log(`✅ Table [${table}]: ACTIVE (Found Columns: ${Object.keys(row).join(', ')})`);
      } else {
        console.log(`✅ Table [${table}]: ACTIVE (Empty table)`);
      }
    }
  }
}

checkTables();
