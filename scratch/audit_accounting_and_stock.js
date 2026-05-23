const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function auditSystem() {
  console.log("=== AUDIT INTEGRITAS FINANSIAL & STOK ===");

  // 1. Ambil 1 Jurnal Terakhir hari ini
  console.log("\n📡 1. Membaca Jurnal Akuntansi Terakhir...");
  const { data: journals, error: jErr } = await supabase
    .from('journals')
    .select('id, reference, description, total_amount, created_at')
    .order('date', { ascending: false })
    .limit(1);

  if (jErr) {
    console.error("❌ Gagal membaca jurnal:", jErr.message);
  } else if (journals.length === 0) {
    console.log("ℹ️ Belum ada jurnal akuntansi hari ini.");
  } else {
    const journal = journals[0];
    console.log(`✅ Jurnal Ditemukan untuk Transaksi: ${journal.reference}`);
    console.log(`- Keterangan: ${journal.description}`);
    console.log(`- Total Nominal: Rp ${journal.total_amount.toLocaleString('id-ID')}`);

    // Ambil detail baris debit/kredit jurnal tersebut
    const { data: lines, error: lErr } = await supabase
      .from('journal_lines')
      .select('account_code, account_name, debit, credit')
      .eq('journal_id', journal.id);

    if (lErr) {
      console.error("❌ Gagal membaca baris jurnal:", lErr.message);
    } else {
      console.log("\n📋 RINCIAN BARIS JURNAL (DOUBLE-ENTRY BOOKKEEPING):");
      console.table(lines.map(l => ({
        "Kode Akun": l.account_code,
        "Nama Akun": l.account_name,
        "Debit (Dr)": `Rp ${l.debit.toLocaleString('id-ID')}`,
        "Kredit (Cr)": `Rp ${l.credit.toLocaleString('id-ID')}`
      })));
    }
  }

  // 2. Ambil 5 Log Mutasi Stok Terakhir hari ini
  console.log("\n📡 2. Membaca Log Mutasi Stok Bahan Baku...");
  const { data: logs, error: logErr } = await supabase
    .from('inventory_logs')
    .select('id, type, change_qty, prev_stock, next_stock, bahan_name, reference_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (logErr) {
    console.error("❌ Gagal membaca log inventory:", logErr.message);
  } else if (logs.length === 0) {
    console.log("ℹ️ Belum ada log mutasi stok hari ini.");
  } else {
    console.log("✅ Log Mutasi Stok Ditemukan (Pengurangan Real-time Berdasarkan Resep BOM):");
    console.table(logs.map(l => ({
      "Bahan Baku": l.bahan_name || 'Bahan',
      "Jenis Mutasi": l.type,
      "Jumlah Mutasi": `${l.change_qty} unit`,
      "Stok Awal": `${l.prev_stock} unit`,
      "Stok Akhir": `${l.next_stock} unit`,
      "Nomor Referensi": l.reference_id || '-',
      "Waktu": new Date(l.created_at).toLocaleTimeString()
    })));
  }
}

auditSystem();
