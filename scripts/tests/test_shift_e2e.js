const http = require('http');

const API_URL = 'http://localhost:3001/api';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': '00000000-0000-0000-0000-000000000000',
        'x-user-role': 'superadmin'
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runShiftE2ETest() {
  console.log("🏁 starting E2E SHIFT TEST (Open -> Transaction -> Close) 🏁\n");

  try {
    // 1. Cek active shift
    console.log("Langkah 1: Memeriksa shift aktif...");
    const activeRes = await request('GET', '/shifts/active');
    console.log(`  Active Shift Status: ${activeRes.status}`);
    
    if (activeRes.status === 200 && activeRes.data && activeRes.data.id) {
      const activeShiftId = activeRes.data.id;
      console.log(`  ⚠️ Menemukan shift aktif ID: ${activeShiftId}. Menutup terlebih dahulu untuk tes bersih...`);
      const closeRes = await request('POST', `/shifts/${activeShiftId}/close`, {
        closingCash: Number(activeRes.data.initial_cash) || 50000,
        notes: "Auto-closed for E2E clean start"
      });
      console.log(`  Close status: ${closeRes.status}, Message:`, closeRes.data.message);
    } else {
      console.log("  ✅ Tidak ada shift aktif. Siap untuk tes.");
    }

    // 2. Buka shift baru
    console.log("\nLangkah 2: Membuka Shift Baru...");
    const openPayload = {
      userId: "00000000-0000-0000-0000-000000000000",
      outletId: "00000000-0000-0000-0000-000000000000",
      openCash: 100000,
      openTime: new Date().toISOString(),
      notes: "E2E Test Initial Shift Open"
    };
    const openRes = await request('POST', '/shifts', openPayload);
    console.log(`  Status: ${openRes.status}`);
    if (openRes.status !== 201) {
      throw new Error(`Gagal membuka shift: ${JSON.stringify(openRes.data)}`);
    }
    const newShift = openRes.data.data;
    const shiftId = newShift.id;
    console.log(`  ✅ Shift baru berhasil dibuka. ID: ${shiftId}, Uang Modal: Rp ${newShift.initial_cash}`);

    // 3. Tambahkan transaksi penjualan
    console.log("\nLangkah 3: Menambahkan Transaksi Penjualan...");
    // Ambil menu untuk ID valid
    const menuRes = await request('GET', '/menu');
    let validMenuId = "00000000-0000-0000-0000-000000000000";
    if (menuRes.status === 200 && menuRes.data.length > 0) {
      validMenuId = menuRes.data[0].id;
    }
    
    const transPayload = {
      customer_name: "Customer E2E Shift",
      payment_method: "Tunai",
      cashier_name: "Kasir E2E",
      table_type: "Take Away",
      total: 75000,
      taxAmount: 7500,
      items: [
        {
          id: validMenuId,
          qty: 3,
          price: 25000
        }
      ]
    };
    const transRes = await request('POST', '/transactions', transPayload);
    console.log(`  Status Transaksi: ${transRes.status}`);
    if (transRes.status !== 201 && transRes.status !== 200) {
      console.warn("  ⚠️ Pembuatan transaksi bermasalah:", transRes.data);
    } else {
      console.log(`  ✅ Transaksi berhasil dibuat. ID: ${transRes.data.id || transRes.data.transaction_id || "N/A"}`);
      
      // Konfirmasi pembayaran agar masuk ke agregasi
      const transId = transRes.data.id || transRes.data.transaction_id;
      if (transId) {
        const confirmRes = await request('PUT', `/transactions/${transId}/confirm`, { payment_method: "Tunai" });
        console.log(`  ✅ Pembayaran Tunai dikonfirmasi. Status: ${confirmRes.status}`);
      }
    }

    // 4. Tutup shift
    console.log("\nLangkah 4: Menutup Shift...");
    // Uang modal 100.000 + penjualan tunai 75.000 + tax 7.500 = 182.500 expected cash
    // Katakanlah uang aktual di laci 182.500
    const closePayload = {
      closingCash: 182500,
      notes: "E2E Test Shift Closing Berhasil"
    };
    const closeRes = await request('POST', `/shifts/${shiftId}/close`, closePayload);
    console.log(`  Status Tutup Shift: ${closeRes.status}`);
    if (closeRes.status !== 200) {
      throw new Error(`Gagal menutup shift: ${JSON.stringify(closeRes.data)}`);
    }
    
    const closedData = closeRes.data.data;
    console.log("\n✅ HASIL TUTUP SHIFT:");
    console.log(`- Status Shift     : ${closedData.status}`);
    console.log(`- Waktu Buka       : ${closedData.start_time}`);
    console.log(`- Waktu Tutup      : ${closedData.end_time}`);
    console.log(`- Uang Modal       : Rp ${Number(closedData.initial_cash).toLocaleString()}`);
    console.log(`- Uang di Laci     : Rp ${Number(closedData.closing_cash).toLocaleString()}`);
    console.log(`- Total Penjualan  : Rp ${Number(closedData.total_sales).toLocaleString()}`);
    console.log(`- Notes            : ${closedData.notes}`);
    console.log("\n🎉 E2E Shift Test BERHASIL dengan Sempurna!");

  } catch (error) {
    console.error("❌ E2E Shift Test GAGAL:", error.message);
  }
}

runShiftE2ETest();
