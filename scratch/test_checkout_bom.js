async function testCheckoutBOM() {
  console.log("=== SIMULASI TRANSAKSI PENJUALAN DENGAN RESEP BOM ===");
  
  // Payload checkout 2 Americano Iced
  const payload = {
    customerName: "Auditor Ken",
    cashierName: "Super Kasir",
    paymentMethod: "QRIS",
    tableType: "Dine In",
    discountAmount: 0,
    taxAmount: 0,
    uniqueCode: 0,
    total: 40000,
    items: [
      {
        id: "ca19dac4-8ad4-47d5-89ae-46a83dcc5aa5", // Americano Iced
        name: "Americano Iced",
        price: 20000,
        qty: 2
      }
    ]
  };

  try {
    console.log("📡 Mengirim permintaan checkout ke http://localhost:3001/api/transactions...");
    const response = await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': '00000000-0000-0000-0000-000000000000'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    console.log("✅ Checkout Berhasil!");
    console.log(`- Nomor Order: ${data.order_number}`);
    console.log(`- Status Pembayaran: ${data.payment_status}`);
    console.log(`- HPP Transaksi: Rp ${data.total_hpp}`);
    console.log(`- Status Jurnal: ${data.journal_status ? 'SUKSES' : 'GAGAL'}`);

  } catch (err) {
    console.error("❌ Checkout Gagal:", err.message);
  }
}

testCheckoutBOM();
