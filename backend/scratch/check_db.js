const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTables() {
  const tables = [
    'menu', 'bahan', 'transactions', 'transaction_items', 
    'branches', 'menu_bom', 'customers', 'tables', 'users', 'settings'
  ];

  console.log('--- PEMERIKSAAN TABEL SUPABASE ---');
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Tabel [${table}]: ERROR - ${error.message}`);
    } else {
      console.log(`✅ Tabel [${table}]: OKE`);
    }
  }
}

checkTables();
