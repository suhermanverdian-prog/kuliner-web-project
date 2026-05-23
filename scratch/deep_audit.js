const { supabase } = require('../backend/src/supabase');

async function runAudit() {
  console.log('--- DEEP SYSTEM AUDIT: DATABASE INTEGRITY ---');

  // 1. Menu without BOM
  const { data: menu } = await supabase.from('menu').select('id, name');
  const { data: bom } = await supabase.from('menu_bom').select('menu_id');
  const menuIdsInBom = new Set(bom.map(b => b.menu_id));
  const menuWithoutBom = menu.filter(m => !menuIdsInBom.has(m.id));
  console.log(`[MENU] Found ${menuWithoutBom.length} menu items without BOM:`, menuWithoutBom.map(m => m.name));

  // 2. BOM with invalid bahan_id
  const { data: bahan } = await supabase.from('bahan').select('id');
  const bahanIds = new Set(bahan.map(b => b.id));
  const { data: bomFull } = await supabase.from('menu_bom').select('id, menu_id, bahan_id');
  const invalidBom = bomFull.filter(b => !bahanIds.has(b.bahan_id));
  console.log(`[BOM] Found ${invalidBom.length} BOM records with invalid bahan_id.`);

  // 3. Transactions with 0 total
  const { data: trxZero } = await supabase.from('transactions').select('id, total').eq('total', 0);
  console.log(`[TRANSACTIONS] Found ${trxZero.length} transactions with Rp 0 total.`);

  // 4. Negative Stock
  const { data: negStock } = await supabase.from('bahan').select('id, name, stock').lt('stock', 0);
  console.log(`[INVENTORY] Found ${negStock.length} items with negative stock.`);

  // 5. Tenant Isolation Audit (Critical Tables)
  const tables = ['menu', 'bahan', 'transactions', 'pembelian', 'suppliers'];
  for (const table of tables) {
    const { data: missingTenant } = await supabase.from(table).select('id').is('tenant_id', null);
    console.log(`[SECURITY] ${table.toUpperCase()}: ${missingTenant?.length || 0} records missing tenant_id.`);
  }

  console.log('--- AUDIT COMPLETE ---');
}

runAudit();
