const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  // Ambil semua pending POs
  const { data: pos } = await sb
    .from('purchase_orders')
    .select('id,po_number,status')
    .in('status', ['pending', 'partially_received']);

  console.log('Total PO pending:', (pos||[]).length);

  const ghostIds = [];
  for (const po of pos || []) {
    const { count } = await sb
      .from('purchase_order_items')
      .select('id', { count: 'exact', head: true })
      .eq('po_id', po.id)
      .gt('purchase_qty', 0);

    if ((count || 0) === 0) ghostIds.push(po.id);
  }

  console.log('Ghost POs to cancel:', ghostIds.length);

  if (ghostIds.length > 0) {
    // Soft-cancel: ubah status ke 'cancelled' bukan hard-delete (sesuai hukum integritas akuntansi)
    const { error } = await sb
      .from('purchase_orders')
      .update({ status: 'cancelled' })
      .in('id', ghostIds);

    if (error) {
      console.error('ERROR:', error.message);
    } else {
      console.log('✅ Berhasil cancel', ghostIds.length, 'Ghost PO.');
    }
  }

  // Verifikasi
  const { count: remaining } = await sb
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'partially_received']);

  console.log('Remaining pending POs after cleanup:', remaining);
})();
