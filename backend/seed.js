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

  // 3. Fill Bahan Baku (Inventory Items) - Data Lengkap
  const items = [
    { id: 101, name: 'Biji Kopi Arabica House Blend', category: 'Coffee Beans', location: 'Gudang Utama', unit: 'Gram', stock: 15000, minStock: 2000, price: 250 },
    { id: 102, name: 'Susu Segar Greenfield', category: 'Milk & Dairy', location: 'Bar', unit: 'Liter', stock: 24, minStock: 6, price: 18500 },
    { id: 103, name: 'Susu Oat (Oatmilk)', category: 'Milk & Dairy', location: 'Bar', unit: 'Liter', stock: 10, minStock: 3, price: 45000 },
    { id: 104, name: 'Gula Aren Cair', category: 'Syrups', location: 'Bar', unit: 'Mililiter', stock: 5000, minStock: 1000, price: 25 },
    { id: 105, name: 'Sirup Vanilla', category: 'Syrups', location: 'Bar', unit: 'Mililiter', stock: 2000, minStock: 500, price: 80 },
    { id: 106, name: 'Sirup Caramel', category: 'Syrups', location: 'Bar', unit: 'Mililiter', stock: 2000, minStock: 500, price: 80 },
    { id: 107, name: 'Bubuk Matcha Premium', category: 'Powder', location: 'Bar', unit: 'Gram', stock: 1000, minStock: 200, price: 400 },
    { id: 108, name: 'Cup Plastik 16oz', category: 'Packaging', location: 'Gudang Utama', unit: 'Pcs', stock: 1000, minStock: 200, price: 1200 },
    { id: 109, name: 'Paper Cup Hot 8oz', category: 'Packaging', location: 'Gudang Utama', unit: 'Pcs', stock: 500, minStock: 100, price: 800 },
    { id: 110, name: 'Sedotan Plastik', category: 'Packaging', location: 'Gudang Utama', unit: 'Pcs', stock: 2000, minStock: 500, price: 100 },
    { id: 111, name: 'Croissant Butter (Frozen)', category: 'Other', location: 'Kitchen', unit: 'Pcs', stock: 50, minStock: 15, price: 12000 },
    { id: 112, name: 'Kentang Goreng (Frozen)', category: 'Other', location: 'Kitchen', unit: 'Gram', stock: 5000, minStock: 1000, price: 30 }
  ];
  await supabase.from('bahan').upsert(items);
  console.log('✅ Bahan Baku terisi lengkap');

  // 4. Fill Menu
  const menuItems = [
    { id: 201, name: 'Espresso (Hot)', category: 'Kopi', price: 20000, cost: 3600, icon: '☕' },
    { id: 202, name: 'Cafe Latte (Iced)', category: 'Kopi', price: 35000, cost: 9500, icon: '☕' },
    { id: 203, name: 'Kopi Susu Aren (Signature)', category: 'Kopi', price: 28000, cost: 8100, icon: '☕' },
    { id: 204, name: 'Americano (Iced)', category: 'Kopi', price: 25000, cost: 4800, icon: '☕' },
    { id: 205, name: 'Caramel Macchiato', category: 'Kopi', price: 40000, cost: 11500, icon: '☕' },
    { id: 206, name: 'Matcha Latte (Iced)', category: 'Non-Kopi', price: 35000, cost: 10500, icon: '🍵' },
    { id: 207, name: 'Butter Croissant', category: 'Makanan', price: 25000, cost: 12000, icon: '🥐' },
    { id: 208, name: 'French Fries', category: 'Makanan', price: 22000, cost: 6000, icon: '🍟' }
  ];
  const { error: menuErr } = await supabase.from('menu').upsert(menuItems);
  if (menuErr) console.error('❌ Menu Error:', menuErr.message);
  else console.log('✅ Menu terisi lengkap');

  // 5. Fill BOM (Resep)
  const boms = [
    { menu_id: 201, bahan_id: 101, qty: 18 }, // Espresso: 18g Kopi
    { menu_id: 201, bahan_id: 109, qty: 1 },  // Espresso: 1 Paper Cup
    { menu_id: 202, bahan_id: 101, qty: 18 }, // Latte: 18g Kopi
    { menu_id: 202, bahan_id: 102, qty: 0.2 },// Latte: 200ml Susu (0.2L)
    { menu_id: 202, bahan_id: 108, qty: 1 },  // Latte: 1 Cup Plastik
    { menu_id: 203, bahan_id: 101, qty: 18 }, // Kopi Aren: 18g Kopi
    { menu_id: 203, bahan_id: 102, qty: 0.15},// Kopi Aren: 150ml Susu (0.15L)
    { menu_id: 203, bahan_id: 104, qty: 30 }, // Kopi Aren: 30ml Gula Aren
    { menu_id: 203, bahan_id: 108, qty: 1 },  // Kopi Aren: 1 Cup Plastik
    { menu_id: 205, bahan_id: 101, qty: 18 }, // Caramel Mac: 18g Kopi
    { menu_id: 205, bahan_id: 102, qty: 0.2 },// Caramel Mac: 200ml Susu
    { menu_id: 205, bahan_id: 106, qty: 25 }, // Caramel Mac: 25ml Sirup Caramel
    { menu_id: 205, bahan_id: 108, qty: 1 },  // Caramel Mac: 1 Cup Plastik
    { menu_id: 206, bahan_id: 107, qty: 15 }, // Matcha: 15g Bubuk Matcha
    { menu_id: 206, bahan_id: 102, qty: 0.2 },// Matcha: 200ml Susu
    { menu_id: 206, bahan_id: 108, qty: 1 },  // Matcha: 1 Cup Plastik
    { menu_id: 207, bahan_id: 111, qty: 1 },  // Croissant: 1 Pcs Frozen
    { menu_id: 208, bahan_id: 112, qty: 200 } // Fries: 200g Kentang
  ];
  const { error: bomErr } = await supabase.from('menu_bom').upsert(boms);
  if (bomErr) console.error('❌ BOM Error:', bomErr.message);
  else console.log('✅ Resep (BOM) terisi lengkap');

  console.log('✨ Selesai! Silakan refresh halaman Inventori.');
}

seed();
