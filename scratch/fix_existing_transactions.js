const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function recover() {
  console.log("=== PEMULIHAN TRANSAKSI TERSANGKUT ===");
  
  // 1. Ambil transaksi pending_payment dari hari ini
  const { data: transactions, error: fetchErr } = await supabase
    .from('transactions')
    .select('id, order_number, payment_status, total')
    .eq('payment_status', 'pending_payment');

  if (fetchErr) {
    console.error("❌ Gagal mengambil transaksi:", fetchErr.message);
    return;
  }

  if (transactions.length === 0) {
    console.log("✅ Tidak ada transaksi berstatus pending_payment.");
    return;
  }

  console.log(`📡 Menemukan ${transactions.length} transaksi tersangkut. Memulai proses pemulihan ke status 'paid'...`);

  for (const t of transactions) {
    console.log(`\nProcessing ${t.order_number} (${t.id})...`);
    
    // Update status transaksi menjadi 'paid'
    const { error: updErr } = await supabase
      .from('transactions')
      .update({ payment_status: 'paid' })
      .eq('id', t.id);

    if (updErr) {
      console.error(`❌ Gagal memperbarui ${t.order_number}:`, updErr.message);
    } else {
      console.log(`✅ ${t.order_number} berhasil diubah menjadi 'paid'!`);
    }
  }

  console.log("\n=== PEMULIHAN SELESAI ===");
}

recover();
