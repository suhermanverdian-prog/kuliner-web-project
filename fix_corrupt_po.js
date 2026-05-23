const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
(async () => {
  const { error } = await sb.from('purchase_orders').update({ status: 'cancelled' }).eq('po_number', 'PO-827398');
  console.log(error ? 'ERROR: ' + error.message : 'OK: PO-827398 cancelled (received > ordered anomaly)');
  // Cek sisa pending POs
  const { data } = await sb.from('purchase_orders').select('po_number,status,total_amount').in('status',['pending','partially_received']);
  console.log('Remaining pending:', JSON.stringify(data));
})();
