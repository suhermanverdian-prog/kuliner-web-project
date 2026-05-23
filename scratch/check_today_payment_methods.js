const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkMethods() {
  console.log("=== DISTRIBUSI METODE PEMBAYARAN TRANSAKSI HARI INI ===");
  const { data, error } = await supabase
    .from('transactions')
    .select('payment_method, payment_status, total')
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error("❌ Gagal membaca database:", error.message);
    return;
  }

  const stats = {};
  data.forEach(t => {
    const key = `${t.payment_method} (${t.payment_status})`;
    stats[key] = (stats[key] || 0) + 1;
  });

  console.log(`Total transaksi hari ini: ${data.length}`);
  console.log("Rincian:");
  console.log(JSON.stringify(stats, null, 2));
}

checkMethods();
