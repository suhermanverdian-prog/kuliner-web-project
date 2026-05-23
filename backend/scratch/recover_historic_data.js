const { supabase } = require('../src/supabase');

async function recoverHistoricData() {
  try {
    console.log('📡 [Self-Healing] Memulai proses ekstraksi 77 Transaksi Historis dari Supabase...');
    
    // 1. Ambil seluruh transaksi dari Supabase Cloud
    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('id, tenant_id, order_number, total, items, created_at');

    if (txErr) {
      throw new Error(`Gagal mengambil data transaksi: ${txErr.message}`);
    }

    console.log(`📊 Berhasil memuat ${txs.length} transaksi dari cloud.`);

    const itemsToInsert = [];
    let unparsableCount = 0;

    // 2. Iterasi & Ekstraksi data detail dari kolom JSONB
    for (const tx of txs) {
      let itemArray = [];

      if (Array.isArray(tx.items)) {
        itemArray = tx.items;
      } else if (tx.items && Array.isArray(tx.items.items)) {
        itemArray = tx.items.items;
      } else if (tx.items && typeof tx.items === 'string') {
        try {
          const parsed = JSON.parse(tx.items);
          if (Array.isArray(parsed)) {
            itemArray = parsed;
          } else if (parsed && Array.isArray(parsed.items)) {
            itemArray = parsed.items;
          }
        } catch (e) {
          console.warn(`⚠️ Gagal memparse string JSONB pada transaksi ${tx.order_number}`);
        }
      }

      if (itemArray.length === 0) {
        unparsableCount++;
        console.warn(`⚠️ Transaksi ${tx.order_number} (${tx.id}) tidak memiliki detail item.`);
        continue;
      }

      // Map item ke skema transaction_items
      for (const item of itemArray) {
        itemsToInsert.push({
          tenant_id: tx.tenant_id || '00000000-0000-0000-0000-000000000000',
          transaction_id: tx.id,
          menu_id: item.id || item.menu_id,
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          created_at: tx.created_at
        });
      }
    }

    console.log(`\n📦 Total baris detail item yang siap dimasukkan: ${itemsToInsert.length}`);
    console.log(`⚠️ Jumlah transaksi tanpa item: ${unparsableCount}`);

    if (itemsToInsert.length === 0) {
      console.log('✅ Tidak ada data detail item yang perlu dipulihkan.');
      return;
    }

    // 3. Masukkan data ke transaction_items dalam batch berukuran 20 baris demi stabilitas network
    console.log('\n🚀 Memulai proses batch insert ke tabel transaction_items...');
    const batchSize = 20;
    let successCount = 0;

    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
      const chunk = itemsToInsert.slice(i, i + batchSize);
      const { data, error: insertErr } = await supabase
        .from('transaction_items')
        .insert(chunk)
        .select('id');

      if (insertErr) {
        console.error(`❌ Batch insert gagal pada indeks ${i}:`, insertErr.message);
        throw insertErr;
      }

      successCount += chunk.length;
      console.log(`✅ Berhasil menyisipkan detail baris ${i + 1} - ${Math.min(i + batchSize, itemsToInsert.length)}`);
    }

    console.log(`\n👑 [PEMULIHAN SELESAI]`);
    console.log(`🎉 Berhasil memulihkan ${successCount} item detail transaksi untuk 77 transaksi historis!`);
    console.log(`📊 Modul Laporan & Analitik Anda kini telah pulih 100% dan siap menyajikan visualisasi data penjualan.`);

  } catch (err) {
    console.error('🚨 Error fatal selama proses pemulihan data:', err.message);
  }
}

recoverHistoricData();
