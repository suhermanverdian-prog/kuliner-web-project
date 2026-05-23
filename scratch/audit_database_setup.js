const { supabase } = require('../backend/src/supabase');

async function runAudit() {
  console.log("=== MEMULAI AUDIT KONEKSI & STRUKTUR DATABASE ===");
  try {
    // 1. Audit Settings
    console.log("\n1. Mengaudit Tabel [settings]...");
    const { data: settings, error: errSet } = await supabase.from('settings').select('*');
    if (errSet) throw errSet;
    console.log(`Jumlah baris settings: ${settings.length}`);
    console.log(settings);

    // 2. Audit Bahan Baku
    console.log("\n2. Mengaudit Tabel [bahan] (Bahan Baku)...");
    const { data: bahan, error: errBahan } = await supabase.from('bahan').select('id, name, stock, unit, cost, tenant_id');
    if (errBahan) throw errBahan;
    console.log(`Jumlah baris bahan baku: ${bahan.length}`);
    if (bahan.length > 0) {
      console.log("Sampel 3 Bahan Baku:");
      console.log(bahan.slice(0, 3));
    }

    // 3. Audit Menu
    console.log("\n3. Mengaudit Tabel [menu] (Daftar Menu)...");
    const { data: menu, error: errMenu } = await supabase.from('menu').select('id, name, price, tenant_id');
    if (errMenu) throw errMenu;
    console.log(`Jumlah baris menu: ${menu.length}`);
    if (menu.length > 0) {
      console.log("Sampel 3 Menu:");
      console.log(menu.slice(0, 3));
    }

    // 4. Audit BOM
    console.log("\n4. Mengaudit Tabel [menu_bom] (Bill of Materials)...");
    const { data: bom, error: errBom } = await supabase.from('menu_bom').select('*');
    if (errBom) throw errBom;
    console.log(`Jumlah baris BOM (menu_bom): ${bom.length}`);
    if (bom.length > 0) {
      console.log("Sampel 3 BOM:");
      console.log(bom.slice(0, 3));
    }

  } catch (err) {
    console.error("❌ ERROR SAAT AUDIT:", err.message);
  }
}

runAudit();
