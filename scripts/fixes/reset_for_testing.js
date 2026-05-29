const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://ixpamdylbkfukofexcgi.supabase.co';
// Using service_role key to bypass RLS for administrative reset
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanERPDatabase() {
  console.log("=================================================================");
  console.log("🚀 KEN ENTERPRISE — ZERO-STATE DATABASE RESET FOR QA TESTING 🚀");
  console.log("=================================================================");
  
  // 1. Transactional tables to completely purge
  const transactionalTables = [
    'journal_lines',
    'journals',
    'stock_movements',
    'purchase_order_items',
    'purchase_orders',
    'purchase_invoices',
    'transaction_items',
    'transactions',
    'audit_logs'
  ];

  for (const table of transactionalTables) {
    console.log(`\n🧹 Purging transactional table: "${table}"...`);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records safely

    if (error) {
      console.warn(`⚠️ Warning or Skip on "${table}":`, error.message);
    } else {
      console.log(`   ✅ Success: "${table}" is now completely empty!`);
    }
  }

  // 2. Reset stock value to 0 on all bahan (raw materials / assembly items)
  console.log("\n🔄 Resetting stock level of all raw materials (bahan) to 0...");
  const { data: bahanList, error: fetchErr } = await supabase.from('bahan').select('id, name');
  
  if (fetchErr) {
    console.error("❌ Failed to fetch materials:", fetchErr.message);
  } else if (bahanList) {
    const { error: updateErr } = await supabase
      .from('bahan')
      .update({ stock: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Reset stock to 0 for all items

    if (updateErr) {
      console.error("❌ Failed to reset stock values:", updateErr.message);
    } else {
      console.log(`   ✅ Success: Reset stock levels to 0 for ${bahanList.length} materials!`);
    }
  }

  console.log("\n=================================================================");
  console.log("🎉 DATABASE IS NOW PURGED & READY FOR FRESH E2E TESTING!");
  console.log("   - Chart of Accounts (COA) is PRESERVED.");
  console.log("   - Materials list & Menu catalog are PRESERVED.");
  console.log("   - Users, Outlets, & Tenants are PRESERVED.");
  console.log("   - All stok, kas, invoice, & ledger are reset to 0 / empty state.");
  console.log("=================================================================");
}

cleanERPDatabase();
