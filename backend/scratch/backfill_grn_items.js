const { supabase } = require('../src/supabase');

async function backfillGrnItems() {
  try {
    console.log('📡 [Self-Healing GRN] Mengambil data GRN dari Supabase Cloud...');
    
    // 1. Ambil 17 GRN yang ada di cloud
    const { data: grns, error: grnErr } = await supabase
      .from('grns')
      .select('id, tenant_id, po_id, grn_number');

    if (grnErr) throw grnErr;
    console.log(`📊 Berhasil memuat ${grns.length} GRNs dari cloud.`);

    // 2. Ambil seluruh purchase_order_items dari cloud untuk pemetaan
    console.log('📡 Mengambil detail item Purchase Order...');
    const { data: poItems, error: poItemsErr } = await supabase
      .from('purchase_order_items')
      .select('po_id, bahan_id, purchase_qty, unit_price');

    if (poItemsErr) throw poItemsErr;
    console.log(`📊 Berhasil memuat ${poItems.length} baris detail PO items.`);

    const grnItemsToInsert = [];

    // 3. Petakan PO items ke GRN items untuk setiap GRN
    for (const grn of grns) {
      if (!grn.po_id) {
        console.log(`⚠️ GRN ${grn.grn_number} tidak memiliki po_id (Skipped).`);
        continue;
      }

      // Cari item PO yang cocok
      const matchingItems = poItems.filter(item => String(item.po_id) === String(grn.po_id));
      
      for (const item of matchingItems) {
        grnItemsToInsert.push({
          tenant_id: grn.tenant_id || '00000000-0000-0000-0000-000000000000',
          grn_id: grn.id,
          bahan_id: item.bahan_id,
          qty_received: Number(item.purchase_qty) || 0,
          price_unit: Number(item.unit_price) || 0
        });
      }
    }

    console.log(`\n📦 Total baris grn_items yang siap dipulihkan: ${grnItemsToInsert.length}`);

    if (grnItemsToInsert.length === 0) {
      console.log('✅ Tidak ada detail GRN yang dapat dicocokkan.');
      return;
    }

    // 4. Batch Insert ke grn_items
    console.log('🚀 Memulai penyisipan data ke tabel grn_items...');
    const { data: inserted, error: insertErr } = await supabase
      .from('grn_items')
      .insert(grnItemsToInsert)
      .select('id');

    if (insertErr) throw insertErr;

    console.log(`\n👑 [PEMULIHAN GRN BERHASIL]`);
    console.log(`🎉 Berhasil memulihkan ${inserted?.length || grnItemsToInsert.length} baris detail penerimaan barang (grn_items)!`);
    
  } catch (err) {
    console.error('🚨 Error selama proses pemulihan grn_items:', err.message);
  }
}

backfillGrnItems();
