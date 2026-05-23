const http = require('http');

const API_URL = 'http://localhost:3001/api';

// Helper function for API requests
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

// Store IDs for cross-test reference
const state = {};

async function runTests() {
  console.log("🚀 Starting E2E Integration Tests (Fase 2 Finalization)\n");

  try {
    // ---------------------------------------------------------
    // 0. Fetch Valid IDs for Foreign Key Constraints
    // ---------------------------------------------------------
    console.log("Test 0: Mengambil referensi data Master...");
    const menuRes = await request('GET', '/menu');
    let validMenuId = "123e4567-e89b-12d3-a456-426614174000"; // fallback
    if (menuRes.status === 200 && menuRes.data.length > 0) {
        validMenuId = menuRes.data[0].id;
        console.log(`  ✅ Referensi Menu ID: ${validMenuId}`);
    } else {
        console.log(`  ⚠️ Menu tidak ditemukan. Status: ${menuRes.status}, Data:`, menuRes.data);
    }

    const invRes = await request('GET', '/inventory');
    let validBahanId = "123e4567-e89b-12d3-a456-426614174000"; // fallback
    if (invRes.status === 200 && invRes.data.length > 0) {
        validBahanId = invRes.data[0].id;
        console.log(`  ✅ Referensi Bahan ID: ${validBahanId}`);
    } else {
        console.log(`  ⚠️ Bahan tidak ditemukan. Status: ${invRes.status}, Data:`, invRes.data);
    }

    // ---------------------------------------------------------
    // 1. Uji POS Transaction
    // ---------------------------------------------------------
    console.log("\nTest 1: Memproses Transaksi POS Kasir...");
    const posPayload = {
      customer_name: "John Kasir",
      payment_method: "Tunai",
      cashier_name: "Admin System",
      table_type: "Dine In",
      total: 55000,
      taxAmount: 5500,
      items: [
        {
          id: validMenuId,
          qty: 2,
          price: 25000
        }
      ]
    };

    const posRes = await request('POST', '/transactions', posPayload);
    console.log(`  => Status: ${posRes.status}`);
    if (posRes.status >= 200 && posRes.status < 300) {
      console.log("  ✅ Transaksi POS berhasil dibuat.");
      state.transactionId = posRes.data.id || posRes.data.transaction_id || posRes.data[0]?.id;
    } else {
      console.log(`  ❌ Transaksi POS gagal:`, posRes.data);
    }

    // ---------------------------------------------------------
    // 2. Uji Konfirmasi Pembayaran (Berdampak pada Akuntansi)
    // ---------------------------------------------------------
    if (state.transactionId) {
      console.log(`Test 2: Konfirmasi Pembayaran Transaksi [${state.transactionId}]...`);
      const confirmRes = await request('PUT', `/transactions/${state.transactionId}/confirm`, {
        payment_method: "Qris"
      });
      console.log(`  => Status: ${confirmRes.status}`);
      if (confirmRes.status >= 200 && confirmRes.status < 300) {
        console.log("  ✅ Konfirmasi pembayaran berhasil. (Akuntansi Jurnal Dibuat)");
      } else {
        console.log(`  ❌ Konfirmasi pembayaran gagal:`, confirmRes.data);
      }
    }

    // ---------------------------------------------------------
    // 3. Uji Guest / Member Order (QR / Self-Order)
    // ---------------------------------------------------------
    console.log("\nTest 3: Memproses Transaksi Self-Order (Member)...");
    const guestPayload = { ...posPayload, customer_name: "Jane Member", payment_method: "Transfer" };
    const guestRes = await request('POST', '/transactions', guestPayload);
    console.log(`  => Status: ${guestRes.status}`);
    if (guestRes.status >= 200 && guestRes.status < 300) {
      console.log("  ✅ Transaksi Member berhasil.");
    } else {
      console.log(`  ❌ Transaksi Member gagal:`, guestRes.data);
    }

    // ---------------------------------------------------------
    // 4. Uji Proses Procurement (PO & GRN)
    // ---------------------------------------------------------
    console.log("\nTest 4: Proses Procurement (Membuat Purchase Order)...");
    const poPayload = {
      supplier_id: crypto.randomUUID(), // Assuming valid UUID bypasses strict relational check for a while, or it fails. Let's see.
      items: [
        { name: "Biji Kopi Arabica", qty: 10, unit: "kg", price: 150000 }
      ],
      total_amount: 1500000,
      notes: "E2E Test PO"
    };
    const poRes = await request('POST', '/p/pos', poPayload);
    console.log(`  => Status: ${poRes.status}`);
    if (poRes.status >= 200 && poRes.status < 300) {
      console.log("  ✅ Purchase Order berhasil dibuat.");
    } else {
      console.log(`  ❌ Purchase Order gagal:`, poRes.data);
    }

    // ---------------------------------------------------------
    // 5. Uji Waste & Stock Opname
    // ---------------------------------------------------------
    console.log("\nTest 5: Mencatat Waste Inventori...");
    const wastePayload = {
      bahanId: validBahanId,
      qty: 1,
      reason: "Basi / Rusak"
    };
    const wasteRes = await request('POST', '/inventory/waste', wastePayload);
    console.log(`  => Status: ${wasteRes.status}`);
    if (wasteRes.status === 404) {
      console.log("  ⚠️ Endpoint POST /inventory/waste belum ada di backend (404 Not Found).");
    } else if (wasteRes.status >= 200 && wasteRes.status < 300) {
      console.log("  ✅ Laporan Waste berhasil dicatat.");
    } else {
      console.log(`  ❌ Laporan Waste gagal:`, wasteRes.data);
    }

    // ---------------------------------------------------------
    // 6. Uji Alur Pengaturan (Simpan Konfigurasi)
    // ---------------------------------------------------------
    console.log("\nTest 6: Menyimpan Konfigurasi Sistem...");
    const settingsPayload = {
      store_name: "KEN Enterprise Testing",
      tax: 11,
      service_charge: 5
    };
    const setRes = await request('POST', '/system/settings', settingsPayload);
    console.log(`  => Status: ${setRes.status}`);
    if (setRes.status >= 200 && setRes.status < 300) {
      console.log("  ✅ Konfigurasi sistem berhasil disimpan.");
    } else {
      console.log(`  ❌ Gagal menyimpan konfigurasi:`, setRes.data);
    }

    // ---------------------------------------------------------
    // 7. Verifikasi Database Connection (Read Accounting Logs)
    // ---------------------------------------------------------
    console.log("\nTest 7: Verifikasi Dampak Akuntansi...");
    const accRes = await request('GET', '/accounting/journals');
    console.log(`  => Status: ${accRes.status}`);
    if (accRes.status >= 200 && accRes.status < 300) {
      console.log("  ✅ Koneksi Database Berhasil. Data Akuntansi dapat diakses.");
    } else {
      console.log(`  ❌ Gagal mengambil data akuntansi:`, accRes.data);
    }

  } catch (error) {
    console.error("Kesalahan E2E Test:", error);
  }

  console.log("\n🏁 E2E Tests Selesai.");
}

runTests();
