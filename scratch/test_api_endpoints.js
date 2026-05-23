async function testAPI() {
  console.log("=== PENGUJIAN HTTP ENDPOINT API ===");
  
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000000'
  };

  try {
    // 1. Uji GET /api/system/shifts/active
    console.log("\n1. Menembak GET http://localhost:3001/api/system/shifts/active...");
    const resActive = await fetch('http://localhost:3001/api/system/shifts/active', { headers });
    if (!resActive.ok) {
      console.error(`❌ Gagal: HTTP ${resActive.status}`);
    } else {
      const activeShift = await resActive.json();
      console.log("✅ Berhasil mendapatkan Active Shift dari API:");
      console.log(JSON.stringify(activeShift, null, 2));
    }

    // 2. Uji GET /api/system/shifts
    console.log("\n2. Menembak GET http://localhost:3001/api/system/shifts...");
    const resAll = await fetch('http://localhost:3001/api/system/shifts', { headers });
    if (!resAll.ok) {
      console.error(`❌ Gagal: HTTP ${resAll.status}`);
    } else {
      const allShifts = await resAll.json();
      console.log(`✅ Berhasil mendapatkan ${allShifts.length} daftar shift dari API.`);
      console.log("Daftar 1 Teratas:");
      console.log(JSON.stringify(allShifts[0], null, 2));
    }
  } catch (err) {
    console.error("❌ Terjadi kesalahan koneksi ke server API lokal:", err.message);
    console.log("💡 Pastikan backend API server Anda sedang berjalan di port 3001.");
  }
}

testAPI();
