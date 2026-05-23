const { supabase } = require('../src/supabase');

async function auditAllTables() {
  console.log('🔍 ===================================================');
  console.log('👑 KEN ENTERPRISE — DATABASE INTEGRITY AUDIT');
  console.log('=======================================================\n');

  const tables = [
    'tenants',
    'outlets',
    'users',
    'role_permissions',
    'accounts',
    'settings',
    'bahan',
    'menu',
    'unit_conversions',
    'suppliers',
    'purchase_orders',
    'purchase_order_items',
    'grns',
    'grn_items',
    'purchase_invoices',
    'purchase_payments',
    'transactions',
    'transaction_items',
    'inventory_logs',
    'stock_movements',
    'shifts',
    'journals',
    'journal_lines',
    'activity_logs',
    'locations'
  ];

  let activeCount = 0;
  let emptyCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        errorCount++;
        console.log(`❌ Tabel [${table.padEnd(22)}]: ERROR (${error.message})`);
      } else {
        const rowCount = count !== null ? count : 0;
        if (rowCount > 0) {
          activeCount++;
          console.log(`✅ Tabel [${table.padEnd(22)}]: AKTIF  (Baris: ${String(rowCount).padEnd(5)})`);
        } else {
          emptyCount++;
          console.log(`⚠️ Tabel [${table.padEnd(22)}]: KOSONG (Baris: 0)`);
        }
      }
    } catch (err) {
      errorCount++;
      console.log(`❌ Tabel [${table.padEnd(22)}]: EXCEPTION (${err.message})`);
    }
  }

  console.log('\n=======================================================');
  console.log(`📊 RINGKASAN INTEGRITAS DATABASE:`);
  console.log(`   - Tabel Aktif (Ada Data) : ${activeCount}`);
  console.log(`   - Tabel Kosong           : ${emptyCount}`);
  console.log(`   - Tabel Error / Missing  : ${errorCount}`);
  console.log(`   - Total Tabel Diaudit    : ${tables.length}`);
  console.log('=======================================================\n');
}

auditAllTables();
