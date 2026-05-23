const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function findQRIS() {
  console.log("=== MEMERIKSA TRANSAKSI QRIS DI DATABASE ===");
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Gagal membaca database:", error.message);
    return;
  }

  console.log(`Ditemukan ${data.length} transaksi terakhir:`);
  data.forEach(t => {
    console.log(`- order_number: ${t.order_number}`);
    console.log(`  created_at: ${t.created_at}`);
    console.log(`  payment_method: ${t.payment_method}`);
    console.log(`  payment_status: ${t.payment_status}`);
    console.log(`  total: ${t.total}`);
    console.log(`  cashier:`, t.items?.cashier_name || 'Tidak ada');
    console.log(`  KDS Status:`, t.items?.kds_status || 'Tidak ada');
  });
}

findQRIS();
