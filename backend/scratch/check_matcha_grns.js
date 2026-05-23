const { supabase } = require('../src/supabase');

async function run() {
  console.log('🔍 [Audit] Checking Matcha GRN logs...');
  const matchaId = 'bb3a1794-7146-49be-950e-18b0aa36cc41';

  // 1. Fetch GRN items for Matcha
  const { data: grnItems, error: gErr } = await supabase
    .from('grn_items')
    .select('*, grns(received_date, po_id)')
    .eq('bahan_id', matchaId);

  if (gErr) {
    console.error('❌ Error fetching grn_items:', gErr.message);
    return;
  }

  console.log('\n🚚 GRN Items for Matcha:', JSON.stringify(grnItems, null, 2));

  // 2. Fetch PO items for Matcha
  const { data: poItems, error: pErr } = await supabase
    .from('purchase_order_items')
    .select('*, purchase_orders(po_number, status)')
    .eq('bahan_id', matchaId);

  if (pErr) {
    console.error('❌ Error fetching po_items:', pErr.message);
    return;
  }

  console.log('\n📋 PO Items for Matcha:', JSON.stringify(poItems, null, 2));
}

run();
