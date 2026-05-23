const { supabase } = require('../src/supabase');

async function check() {
  console.log('🔍 Checking procurement tables...');
  
  const tables = ['grns', 'grn_items', 'purchase_invoices', 'purchase_orders', 'suppliers'];
  
  for (const table of tables) {
    console.log(`\n------------------ Table: ${table} ------------------`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`❌ [${table}] Error:`, error.message, '\nCode:', error.code, '\nDetails:', error.details);
    } else {
      console.log(`✅ [${table}] Accessible. Sample Row:`, data);
    }
  }
}

check().catch(console.error);
