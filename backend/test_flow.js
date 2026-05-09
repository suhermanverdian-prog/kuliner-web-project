const { supabase } = require('./src/supabase');

async function runFlow() {
  console.log("=== MEMULAI SIMULASI E2E FLOW ===");

  // 1. Ambil Data Dasar
  const { data: bahan } = await supabase.from('bahan').select('*').limit(1);
  const { data: menu } = await supabase.from('menu').select('*').limit(1);
  
  if (!bahan || !bahan[0]) return console.log("Gagal: Tabel bahan kosong");
  if (!menu || !menu[0]) return console.log("Gagal: Tabel menu kosong");

  console.log(`Menggunakan Bahan: ${bahan[0].name}, Menu: ${menu[0].name}`);

  // 2. Buat PO (Pembelian)
  console.log("\n--- Langkah 1: Buat PO ---");
  const qtyOrdered = 10;
  const price = 50000;
  const totalAmount = qtyOrdered * price;
  
  const { data: po, error: poErr } = await supabase.from('pembelian').insert([{
    po_number: `SIM-${Date.now()}`,
    supplier_id: 1, // asumsikan supplier 1 ada
    location: 'Gudang Utama',
    status: 'Pending',
    total_amount: totalAmount
  }]).select().single();

  if (poErr) return console.log("ERROR Buat PO:", poErr.message);
  console.log("PO Berhasil Dibuat:", po.po_number);

  const { error: piErr } = await supabase.from('pembelian_items').insert([{
    pembelian_id: po.id,
    bahan_id: bahan[0].id,
    qty_ordered: qtyOrdered,
    qty_received: 0,
    price_at_order: price
  }]);
  if (piErr) return console.log("ERROR Buat PO Item:", piErr.message);

  // 3. Receive PO (Barang Diterima / GRN)
  console.log("\n--- Langkah 2: Barang Diterima (GRN) ---");
  // Simulasikan logic yang ada di app.put('/api/po/:id') secara langsung ke DB
  // a. Update status PO
  await supabase.from('pembelian').update({ status: 'Diterima' }).eq('id', po.id);
  // b. Update stock bahan
  await supabase.from('bahan').update({ stock: bahan[0].stock + qtyOrdered }).eq('id', bahan[0].id);
  // c. Stock Movement
  await supabase.from('stock_movements').insert([{
    product_id: bahan[0].id, type: 'in', qty: qtyOrdered, reference_type: 'purchase', reference_id: po.id
  }]);
  // d. Jurnal Akuntansi GRN
  const { data: jGrn, error: jErr } = await supabase.from('journals').insert([{
    reference: po.po_number, description: `Penerimaan Barang (GRN) dari PO ${po.po_number}`
  }]).select().single();
  if (jErr) return console.log("ERROR Buat Jurnal GRN:", jErr.message);
  
  await supabase.from('journal_lines').insert([
    { journal_id: jGrn.id, account_name: 'Inventory', debit: totalAmount, credit: 0 },
    { journal_id: jGrn.id, account_name: 'Accounts Payable', debit: 0, credit: totalAmount }
  ]);
  console.log("GRN Selesai, Stok Bertambah, Jurnal Terbentuk.");

  // 4. Create Transaction (Penjualan)
  console.log("\n--- Langkah 3: Penjualan POS ---");
  const salesQty = 2;
  const salesPrice = 25000;
  const salesTotal = salesQty * salesPrice;

  const { data: trx, error: txErr } = await supabase.from('transactions').insert([{
    id: `TRX-${Date.now()}`,
    cashier_name: 'System Test',
    customer_name: 'Tamu',
    subtotal: salesTotal,
    tax_amount: 0,
    total: salesTotal,
    payment_method: 'Tunai',
    payment_status: 'paid'
  }]).select().single();

  if (txErr) return console.log("ERROR Buat TRX:", txErr.message);
  console.log("Transaksi Berhasil:", trx.receipt_number);

  // Potong stok (Simulasi logic BOM)
  await supabase.from('bahan').update({ stock: bahan[0].stock + qtyOrdered - salesQty }).eq('id', bahan[0].id);
  await supabase.from('stock_movements').insert([{
    product_id: bahan[0].id, type: 'out', qty: salesQty, reference_type: 'sales', reference_id: trx.id
  }]);

  // Jurnal Penjualan
  const { data: jSales } = await supabase.from('journals').insert([{
    reference: trx.id, description: `Pelunasan Transaksi via Tunai`
  }]).select().single();
  await supabase.from('journal_lines').insert([
    { journal_id: jSales.id, account_name: 'Kas', debit: salesTotal, credit: 0 },
    { journal_id: jSales.id, account_name: 'Sales', debit: 0, credit: salesTotal }
  ]);
  console.log("Penjualan Selesai, Stok Berkurang, Jurnal Terbentuk.");

  // 5. Cek Laporan Akhir
  console.log("\n--- Langkah 4: Cek Integritas Data ---");
  const { data: finalBahan } = await supabase.from('bahan').select('stock').eq('id', bahan[0].id).single();
  console.log(`Stok Awal: ${bahan[0].stock} | Tambah: +${qtyOrdered} | Kurang: -${salesQty} | Stok Akhir DB: ${finalBahan.stock}`);
  
  const { data: journals } = await supabase.from('journals').select('reference, description, lines:journal_lines(account_name, debit, credit)').in('id', [jGrn.id, jSales.id]);
  console.log("\nJurnal Terbentuk:");
  journals.forEach(j => {
    console.log(`- ${j.reference}: ${j.description}`);
    j.lines.forEach(l => console.log(`    ${l.account_name} | D: ${l.debit} | K: ${l.credit}`));
  });

  console.log("\n=== SIMULASI E2E SELESAI ===");
}

runFlow();
