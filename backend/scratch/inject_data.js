const { supabase } = require('../src/supabase');

async function inject() {
  console.log('Mencari konfigurasi Tenant Utama...');
  const { data: tenantData } = await supabase.from('tenants').select('id').limit(1).single();
  const tenantId = tenantData ? tenantData.id : 'T-001';
  console.log('Tenant ID Ditemukan:', tenantId);

  console.log('\n[1/3] Menyuntikkan 5 Bahan Baku Premium...');
  const bahan = [
    { name: 'Matcha Powder Premium', category: 'Bahan Utama', unit: 'Gram', stock: 5000, min_stock: 500, cost: 1500, tenant_id: tenantId },
    { name: 'Oat Milk Barista Edition', category: 'Bahan Tambahan', unit: 'ml', stock: 10000, min_stock: 1000, cost: 60, tenant_id: tenantId },
    { name: 'Caramel Syrup Artisanal', category: 'Bahan Tambahan', unit: 'ml', stock: 5000, min_stock: 500, cost: 120, tenant_id: tenantId },
    { name: 'Cream Cheese Hokkaido', category: 'Bahan Tambahan', unit: 'Gram', stock: 2000, min_stock: 200, cost: 200, tenant_id: tenantId },
    { name: 'Earl Grey Tea Leaf', category: 'Bahan Utama', unit: 'Gram', stock: 3000, min_stock: 300, cost: 500, tenant_id: tenantId }
  ];
  
  // Menghapus data dengan nama yang sama jika ada (untuk menghindari duplikasi)
  await supabase.from('bahan').delete().in('name', bahan.map(b => b.name)).eq('tenant_id', tenantId);

  const { data: insertedBahan, error: errBahan } = await supabase.from('bahan').insert(bahan).select();
  if (errBahan) { console.error('Gagal memasukkan bahan baku:', errBahan); return; }
  console.log('✔ Sukses: 5 Bahan Baku ditambahkan.');

  console.log('\n[2/3] Menyuntikkan 5 Menu Eksekutif dengan Foto Unsplash...');
  const menus = [
    { name: 'Kyoto Iced Matcha', category: 'Signature', price: 35000, stock: 100, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=1000&auto=format&fit=crop', is_available: true, tenant_id: tenantId },
    { name: 'Oat Caramel Macchiato', category: 'Coffee', price: 42000, stock: 100, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=1000&auto=format&fit=crop', is_available: true, tenant_id: tenantId },
    { name: 'Sea Salt Cheese Latte', category: 'Signature', price: 45000, stock: 100, image: 'https://images.unsplash.com/photo-1599507963286-50e50f3b4e7d?q=80&w=1000&auto=format&fit=crop', is_available: true, tenant_id: tenantId },
    { name: 'London Fog Earl Grey', category: 'Tea', price: 32000, stock: 100, image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?q=80&w=1000&auto=format&fit=crop', is_available: true, tenant_id: tenantId },
    { name: 'Matcha Espresso Fusion', category: 'Coffee', price: 40000, stock: 100, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=1000&auto=format&fit=crop', is_available: true, tenant_id: tenantId }
  ];

  await supabase.from('menu').delete().in('name', menus.map(m => m.name)).eq('tenant_id', tenantId);

  const { data: insertedMenus, error: errMenus } = await supabase.from('menu').insert(menus).select();
  if (errMenus) { console.error('Gagal memasukkan menu:', errMenus); return; }
  console.log('✔ Sukses: 5 Menu Baru ditambahkan.');

  console.log('\n[3/3] Merakit Bill of Materials (BOM)...');
  // Cari ID Kopi (Espresso)
  const { data: espressoBahan } = await supabase.from('bahan').select('id').ilike('name', '%kopi%').limit(1).single();
  const espressoId = espressoBahan ? espressoBahan.id : insertedBahan[0].id;

  const getBahanId = (name) => insertedBahan.find(b => b.name.includes(name)).id;

  const boms = [
    // Kyoto Iced Matcha
    { menu_id: insertedMenus[0].id, bahan_id: getBahanId('Matcha'), qty_needed: 15, tenant_id: tenantId },
    { menu_id: insertedMenus[0].id, bahan_id: getBahanId('Oat'), qty_needed: 150, tenant_id: tenantId },
    // Oat Caramel Macchiato
    { menu_id: insertedMenus[1].id, bahan_id: getBahanId('Oat'), qty_needed: 200, tenant_id: tenantId },
    { menu_id: insertedMenus[1].id, bahan_id: getBahanId('Caramel'), qty_needed: 30, tenant_id: tenantId },
    { menu_id: insertedMenus[1].id, bahan_id: espressoId, qty_needed: 18, tenant_id: tenantId },
    // Sea Salt Cheese Latte
    { menu_id: insertedMenus[2].id, bahan_id: getBahanId('Cream Cheese'), qty_needed: 30, tenant_id: tenantId },
    { menu_id: insertedMenus[2].id, bahan_id: espressoId, qty_needed: 18, tenant_id: tenantId },
    // London Fog Earl Grey
    { menu_id: insertedMenus[3].id, bahan_id: getBahanId('Earl Grey'), qty_needed: 5, tenant_id: tenantId },
    { menu_id: insertedMenus[3].id, bahan_id: getBahanId('Oat'), qty_needed: 150, tenant_id: tenantId },
    // Matcha Espresso Fusion
    { menu_id: insertedMenus[4].id, bahan_id: getBahanId('Matcha'), qty_needed: 10, tenant_id: tenantId },
    { menu_id: insertedMenus[4].id, bahan_id: espressoId, qty_needed: 18, tenant_id: tenantId },
    { menu_id: insertedMenus[4].id, bahan_id: getBahanId('Oat'), qty_needed: 100, tenant_id: tenantId },
  ];
  
  const { data: insertedBoms, error: errBoms } = await supabase.from('menu_bom').insert(boms).select();
  if (errBoms) { console.error('Gagal merakit BOM:', errBoms); return; }
  console.log(`✔ Sukses: ${insertedBoms.length} Aturan BOM dirakit dan siap digunakan.`);
  console.log('\n🌟 OPERASI SELESAI: Database KEN Enterprise telah diperbarui dengan produk elit.');
}

inject();
