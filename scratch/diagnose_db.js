const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function diagnose() {
  console.log("=== DIAGNOSIS DATABASE SUPABASE ===");
  console.log("Supabase URL:", process.env.SUPABASE_URL);

  // 1. Cek Shifts Aktif
  console.log("\n1. MEMERIKSA TABEL SHIFTS...");
  const { data: activeShifts, error: shiftErr } = await supabase
    .from('shifts')
    .select('*')
    .eq('status', 'open');

  if (shiftErr) {
    console.error("❌ Gagal membaca shifts:", shiftErr.message);
  } else {
    console.log("✅ Berhasil membaca shifts. Jumlah shift aktif:", activeShifts.length);
    activeShifts.forEach(s => {
      console.log(`- ID Shift: ${s.id}`);
      console.log(`  Nama Kasir: ${s.cashier_name}`);
      console.log(`  Modal Awal: ${s.starting_cash || s.initial_cash}`);
      console.log(`  Mulai Sejak: ${s.start_time}`);
      console.log(`  Outlet ID: ${s.outlet_id}`);
      console.log(`  Tenant ID: ${s.tenant_id}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Total Penjualan di Shift: ${s.total_sales}`);
    });
  }

  // 2. Cek Transaksi terbaru
  console.log("\n2. MEMERIKSA STATUS KDS TRANSAKSI TERAKHIR...");
  const { data: transactions, error: trxErr } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (trxErr) {
    console.error("❌ Gagal membaca transactions:", trxErr.message);
  } else {
    console.log("✅ Berhasil membaca transactions. Jumlah ditemukan:", transactions.length);
    transactions.forEach((t, index) => {
      console.log(`- [${index + 1}] order_number: ${t.order_number}`);
      console.log(`  payment_status: ${t.payment_status}`);
      console.log(`  total: ${t.total}`);
      console.log(`  tenant_id: ${t.tenant_id}`);
      console.log(`  kds_status:`, t.items?.kds_status || 'Tidak ada');
    });
  }
}

diagnose();
