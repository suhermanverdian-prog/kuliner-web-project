const http = require('http');

const optionsTemplate = {
  hostname: 'localhost',
  port: 3001,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000000',
    'x-user-role': 'superadmin'
  }
};

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      ...optionsTemplate,
      path: `/api${path}`,
      method: method,
      headers: {
        ...optionsTemplate.headers
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

async function runWarehouseTests() {
  console.log("🧪 Memulai Pengujian Unit & Integrasi Multi-Warehouse & Mutasi Stok...\n");

  try {
    // 1. Ambil outlet untuk referensi outlet_id
    console.log("Langkah 1: Mengambil daftar outlet...");
    const outletsRes = await request('GET', '/system/outlets');
    if (outletsRes.status !== 200 || !outletsRes.data || outletsRes.data.length === 0) {
      console.error("❌ Gagal mendapatkan data outlet untuk testing.");
      return;
    }
    const sourceOutlet = outletsRes.data[0];
    const targetOutlet = outletsRes.data[1] || outletsRes.data[0];
    console.log(`  ✅ Outlet Asal: ${sourceOutlet.name} (${sourceOutlet.id})`);
    console.log(`  ✅ Outlet Tujuan: ${targetOutlet.name} (${targetOutlet.id})`);

    // 2. Ambil daftar bahan baku (bahan)
    console.log("\nLangkah 2: Mengambil daftar bahan baku...");
    const bahanRes = await request('GET', '/inventory/');
    if (bahanRes.status !== 200 || !bahanRes.data || bahanRes.data.length === 0) {
      console.error("❌ Gagal mendapatkan data bahan baku untuk testing. Response:", bahanRes.data);
      return;
    }
    const targetBahan = bahanRes.data[0];
    console.log(`  ✅ Bahan Baku Target: ${targetBahan.name} (${targetBahan.id})`);

    // 3. Ambil daftar gudang
    console.log("\nLangkah 3: Mengambil daftar gudang...");
    const warehousesRes = await request('GET', '/inventory/warehouses');
    console.log(`  => Status: ${warehousesRes.status}`);
    if (warehousesRes.status !== 200) {
      console.error("❌ Gagal mengambil daftar gudang:", warehousesRes.data);
      return;
    }
    console.log(`  ✅ Berhasil mengambil daftar gudang. Jumlah gudang: ${warehousesRes.data.length}`);

    // Dapatkan Gudang Utama untuk outlet asal
    const sourceMainWH = warehousesRes.data.find(w => w.outlet_id === sourceOutlet.id && w.is_main);
    if (!sourceMainWH) {
      console.error(`❌ Gudang Utama untuk Outlet ${sourceOutlet.name} tidak ditemukan.`);
      return;
    }
    console.log(`  ✅ Gudang Utama Asal: ${sourceMainWH.name} (${sourceMainWH.id})`);

    // 4. Tambah Gudang Baru (Sub-Warehouse)
    console.log("\nLangkah 4: Menambah sub-gudang baru (misal: Dapur)...");
    const kitchenWHPayload = {
      name: "Dapur Utama",
      outletId: sourceOutlet.id
    };
    const addWHRes = await request('POST', '/inventory/warehouses', kitchenWHPayload);
    console.log(`  => Status: ${addWHRes.status}`);
    let subWH = null;
    if (addWHRes.status === 201) {
      console.log("  ✅ Berhasil membuat sub-gudang baru:", addWHRes.data);
      subWH = addWHRes.data;
    } else {
      console.error("  ❌ Gagal membuat sub-gudang:", addWHRes.data);
      return;
    }

    // 5. Uji Mutasi Internal (Intra-outlet: Gudang Utama -> Dapur Utama)
    console.log("\nLangkah 5: Menguji Mutasi Stok Internal (Intra-Outlet)...");
    const internalTransferPayload = {
      sourceWarehouseId: sourceMainWH.id,
      destWarehouseId: subWH.id,
      items: [
        {
          bahanId: targetBahan.id,
          qty: 2
        }
      ]
    };

    const internalRes = await request('POST', '/inventory/transfers', internalTransferPayload);
    console.log(`  => Status: ${internalRes.status}`);
    if (internalRes.status === 200) {
      console.log("  ✅ Mutasi internal sukses:", internalRes.data);
    } else {
      console.error("  ❌ Mutasi internal gagal:", internalRes.data);
    }

    // 6. Uji Mutasi Eksternal (Inter-outlet) jika ada lebih dari 1 outlet
    if (sourceOutlet.id !== targetOutlet.id) {
      console.log("\nLangkah 6: Menguji Mutasi Stok Antar Outlet (Inter-Outlet)...");
      const interOutletPayload = {
        sourceWarehouseId: sourceMainWH.id,
        destOutletId: targetOutlet.id,
        items: [
          {
            bahanId: targetBahan.id,
            qty: 1
          }
        ]
      };

      const interOutletRes = await request('POST', '/inventory/transfers', interOutletPayload);
      console.log(`  => Status: ${interOutletRes.status}`);
      if (interOutletRes.status === 200) {
        console.log("  ✅ Mutasi antar outlet sukses:", interOutletRes.data);
      } else {
        console.error("  ❌ Mutasi antar outlet gagal:", interOutletRes.data);
      }
    } else {
      console.log("\nLangkah 6: Lewati Mutasi Antar Outlet karena hanya terdeteksi 1 outlet.");
    }

  } catch (error) {
    console.error("❌ Kesalahan selama pengujian:", error);
  }

  console.log("\n🏁 Pengujian selesai.");
}

runWarehouseTests();
