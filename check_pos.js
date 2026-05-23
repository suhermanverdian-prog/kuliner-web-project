const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  const { data: pos } = await sb
    .from('purchase_orders')
    .select('id,po_number,status,total_amount,created_at')
    .in('status', ['pending', 'partially_received'])
    .limit(10);

  console.log('=== PENDING POs ===');
  for (const po of pos || []) {
    const { data: items } = await sb
      .from('purchase_order_items')
      .select('id,bahan_id,purchase_qty,received_qty,purchase_unit')
      .eq('po_id', po.id);

    const validItems = (items || []).filter(i => i.bahan_id && Number(i.purchase_qty) > 0);
    const verdict = validItems.length === 0 ? '🚨 GHOST PO (no valid items)' : '✅ OK';
    console.log(verdict + ' | ' + po.po_number + ' | status:' + po.status + ' | total_items:' + (items||[]).length + ' | valid:' + validItems.length + ' | amount:' + po.total_amount);
    (items || []).forEach(i => console.log('   -> bahan_id:' + i.bahan_id + ' qty:' + i.purchase_qty + ' rcv:' + i.received_qty + ' unit:' + i.purchase_unit));
  }
})();
