const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🚀 Memulai pengisian data...');

  // 1. Fill Inventory Meta
  const { error: metaErr } = await supabase.from('inventory_meta').upsert({
    id: 1,
    categories: ['Coffee Beans', 'Milk & Dairy', 'Syrups', 'Powder', 'Packaging', 'Other'],
    packageUnits: ['Karton', 'Dus', 'Ball', 'Box'],
    itemUnits: ['Gram', 'Liter', 'Botol', 'Pcs', 'Sachet', 'Kg']
  });
  if (metaErr) console.error('❌ Meta Error:', metaErr.message);
  else console.log('✅ Meta Data terisi');

  // 2. Fill Locations
  const locations = [
    { name: 'Bar', type: 'Outlet' },
    { name: 'Gudang Utama', type: 'Gudang' },
    { name: 'Kitchen', type: 'Kitchen' }
  ];
  const { error: locErr } = await supabase.from('locations').upsert(locations, { onConflict: 'name' });
  if (locErr) console.error('❌ Location Error:', locErr.message);
  else console.log('✅ Lokasi terisi');

  // 3. Fill Bahan (Inventory Items) - tetapkan ID agar sesuai dengan BOM di data.json
  const items = [
    { id: 101, name: 'Biji Kopi Arabica', category: 'Coffee Beans', location: 'Gudang Utama', unit: 'Gram', stock: 5000, minStock: 1000, price: 250 },
    { id: 102, name: 'Susu Segar', category: 'Milk & Dairy', location: 'Bar', unit: 'Liter', stock: 12, minStock: 6, price: 18500 },
    { id: 103, name: 'Gula Aren', category: 'Syrups', location: 'Kitchen', unit: 'Gram', stock: 2000, minStock: 500, price: 50 },
    { id: 104, name: 'Cup Plastik', category: 'Packaging', location: 'Gudang Utama', unit: 'Pcs', stock: 500, minStock: 100, price: 1000 }
  ];
  await supabase.from('bahan').upsert(items);
  console.log('✅ Bahan Baku terisi');

  // 4. Fill Menu
  const menuItems = [
    { id: 201, name: 'Espresso', category: 'Kopi', price: 25000, cost: 4600, icon: '☕', unit: 'Cup', stock: 99, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80' },
    { id: 202, name: 'Cafe Latte', category: 'Kopi', price: 35000, cost: 7600, icon: '☕', unit: 'Cup', stock: 99, image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=400&q=80' },
    { id: 203, name: 'Kopi Susu Aren', category: 'Kopi', price: 28000, cost: 2812, icon: '☕', unit: 'Cup', stock: 99 },
    { id: 204, name: 'Americano', category: 'Kopi', price: 28000, cost: 5100, icon: '☕', unit: 'Cup', stock: 99, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=400&q=80' }
  ];
  await supabase.from('menu').upsert(menuItems);
  console.log('✅ Menu terisi');

  // 5. Fill BOM (Resep)
  const boms = [
    { menu_id: 201, bahan_id: 101, qty: 18 }, // Espresso pakai 18gr kopi
    { menu_id: 202, bahan_id: 101, qty: 18 }, // Latte pakai 18gr kopi
    { menu_id: 202, bahan_id: 102, qty: 150 }, // Latte pakai 150ml susu
    { menu_id: 203, bahan_id: 101, qty: 15 },
    { menu_id: 203, bahan_id: 103, qty: 30 }
  ];
  await supabase.from('menu_bom').upsert(boms);
  console.log('✅ Resep (BOM) terisi');

  console.log('✨ Selesai! Silakan refresh halaman Inventori.');
}

seed();
