/**
 * 🌱 KEN ENTERPRISE - Database Seeder Script
 * Mengisi data master awal (users, menu, settings, bahan) ke Supabase.
 * Gunakan: node seed_database.js
 */
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const bcrypt = require(path.join(__dirname, 'backend/node_modules/bcryptjs'));
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TENANT_ID = '00000000-0000-0000-0000-000000000000';

async function seed() {
  console.log('🌱 Memulai seeding database...\n');

  // ─────────────────────────────────────────────
  // 1. SEED TENANT
  // ─────────────────────────────────────────────
  console.log('1️⃣  Seeding Tenant...');
  const { error: tErr } = await supabase.from('tenants').upsert([{
    id: TENANT_ID,
    name: 'KEN Coffee Enterprise',
    tier: 'enterprise',
    is_active: true,
    feature_overrides: {}
  }], { onConflict: 'id' });
  console.log(tErr ? `   ❌ Tenant Error: ${tErr.message}` : '   ✅ Tenant OK');

  // ─────────────────────────────────────────────
  // 2. SEED USERS
  // ─────────────────────────────────────────────
  console.log('2️⃣  Seeding Users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  const users = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Super Admin', username: 'superadmin', email: 'admin@ken.id', password: hashedPassword, role: 'superadmin', tenant_id: TENANT_ID, permissions: { all: true } },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Admin Outlet', username: 'admin', email: 'admin.outlet@ken.id', password: hashedPassword, role: 'admin', tenant_id: TENANT_ID, permissions: { all: true } },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Kasir 01', username: 'kasir', email: 'kasir@ken.id', password: kasirPassword, role: 'kasir', tenant_id: TENANT_ID, permissions: { pos: true, kds: true } },
  ];

  for (const u of users) {
    const { error } = await supabase.from('users').upsert([u], { onConflict: 'id' });
    console.log(error ? `   ❌ User "${u.username}": ${error.message}` : `   ✅ User "${u.username}" OK`);
  }

  // ─────────────────────────────────────────────
  // 3. SEED SETTINGS
  // ─────────────────────────────────────────────
  console.log('3️⃣  Seeding Settings...');
  const { error: sErr } = await supabase.from('settings').upsert([{
    tenant_id: TENANT_ID,
    store_name: 'KEN Coffee Enterprise',
    tax: 11,
    service_charge: 5,
    currency: 'IDR',
    logo_url: '/logo-ken.png'
  }], { onConflict: 'tenant_id' });
  console.log(sErr ? `   ❌ Settings Error: ${sErr.message}` : '   ✅ Settings OK');

  // ─────────────────────────────────────────────
  // 4. SEED MENU ITEMS
  // ─────────────────────────────────────────────
  console.log('4️⃣  Seeding Menu...');
  const menuItems = [
    { name: 'Espresso', price: 18000, category: 'Coffee', sku: 'COF-001', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Americano', price: 22000, category: 'Coffee', sku: 'COF-002', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Cappuccino', price: 28000, category: 'Coffee', sku: 'COF-003', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Cafe Latte', price: 28000, category: 'Coffee', sku: 'COF-004', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Mocha Latte', price: 32000, category: 'Coffee', sku: 'COF-005', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Matcha Latte', price: 30000, category: 'Non-Coffee', sku: 'NON-001', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Taro Latte', price: 28000, category: 'Non-Coffee', sku: 'NON-002', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Thai Tea', price: 25000, category: 'Non-Coffee', sku: 'NON-003', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Croissant', price: 22000, category: 'Pastry', sku: 'PST-001', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Chocolate Cake', price: 35000, category: 'Pastry', sku: 'PST-002', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'French Fries', price: 20000, category: 'Snack', sku: 'SNK-001', tenant_id: TENANT_ID, is_active: true, image: '' },
    { name: 'Nasi Goreng Spesial', price: 35000, category: 'Food', sku: 'FOD-001', tenant_id: TENANT_ID, is_active: true, image: '' },
  ];

  const { data: insertedMenu, error: mErr } = await supabase.from('menu').upsert(menuItems, { onConflict: 'sku' }).select('id, name');
  if (mErr) {
    // Fallback: insert one by one if upsert with sku fails
    console.log(`   ⚠️ Bulk upsert gagal (${mErr.message}), mencoba insert satu-satu...`);
    for (const item of menuItems) {
      const { error: iErr } = await supabase.from('menu').insert([item]);
      console.log(iErr ? `   ❌ Menu "${item.name}": ${iErr.message}` : `   ✅ Menu "${item.name}" OK`);
    }
  } else {
    console.log(`   ✅ ${(insertedMenu || []).length} menu berhasil disimpan.`);
  }

  // ─────────────────────────────────────────────
  // 5. SEED BAHAN (Inventory)
  // ─────────────────────────────────────────────
  console.log('5️⃣  Seeding Bahan (Inventori)...');
  const bahanItems = [
    { name: 'Biji Kopi Arabica', stock: 50, unit: 'kg', min_stock: 10, cost: 120000, category: 'Bahan Baku', tenant_id: TENANT_ID },
    { name: 'Susu Full Cream', stock: 30, unit: 'liter', min_stock: 5, cost: 18000, category: 'Bahan Baku', tenant_id: TENANT_ID },
    { name: 'Gula Pasir', stock: 20, unit: 'kg', min_stock: 5, cost: 14000, category: 'Bahan Baku', tenant_id: TENANT_ID },
    { name: 'Bubuk Matcha', stock: 5, unit: 'kg', min_stock: 2, cost: 250000, category: 'Bahan Baku', tenant_id: TENANT_ID },
    { name: 'Bubuk Cokelat', stock: 8, unit: 'kg', min_stock: 3, cost: 85000, category: 'Bahan Baku', tenant_id: TENANT_ID },
    { name: 'Syrup Vanilla', stock: 10, unit: 'botol', min_stock: 3, cost: 45000, category: 'Sirup', tenant_id: TENANT_ID },
    { name: 'Whipped Cream', stock: 6, unit: 'kaleng', min_stock: 2, cost: 35000, category: 'Topping', tenant_id: TENANT_ID },
    { name: 'Cup 12oz', stock: 500, unit: 'pcs', min_stock: 100, cost: 800, category: 'Packaging', tenant_id: TENANT_ID },
    { name: 'Lid Cup', stock: 500, unit: 'pcs', min_stock: 100, cost: 400, category: 'Packaging', tenant_id: TENANT_ID },
    { name: 'Sedotan Kertas', stock: 300, unit: 'pcs', min_stock: 50, cost: 300, category: 'Packaging', tenant_id: TENANT_ID },
  ];

  for (const b of bahanItems) {
    const { error } = await supabase.from('bahan').insert([b]);
    console.log(error ? `   ❌ Bahan "${b.name}": ${error.message}` : `   ✅ Bahan "${b.name}" OK`);
  }

  // ─────────────────────────────────────────────
  // 6. SEED CHART OF ACCOUNTS (COA)
  // ─────────────────────────────────────────────
  console.log('6️⃣  Seeding Chart of Accounts...');
  const coaItems = [
    { tenant_id: TENANT_ID, code: '1-1000', name: 'Kas Tunai', category: 'Asset', normal_balance: 'Debit' },
    { tenant_id: TENANT_ID, code: '1-1010', name: 'Rekening Bank', category: 'Asset', normal_balance: 'Debit' },
    { tenant_id: TENANT_ID, code: '1-2000', name: 'Inventory / Persediaan Bahan Baku', category: 'Asset', normal_balance: 'Debit' },
    { tenant_id: TENANT_ID, code: '2-1000', name: 'Accounts Payable / Hutang Usaha', category: 'Liability', normal_balance: 'Credit' },
    { tenant_id: TENANT_ID, code: '2-1010', name: 'Hutang Pajak (PPN)', category: 'Liability', normal_balance: 'Credit' },
    { tenant_id: TENANT_ID, code: '3-1000', name: 'Modal Pemilik', category: 'Equity', normal_balance: 'Credit' },
    { tenant_id: TENANT_ID, code: '4-1000', name: 'Pendapatan Penjualan', category: 'Revenue', normal_balance: 'Credit' },
    { tenant_id: TENANT_ID, code: '5-1000', name: 'HPP / COGS', category: 'Expense', normal_balance: 'Debit' },
    { tenant_id: TENANT_ID, code: '5-2000', name: 'Beban Operasional / Waste', category: 'Expense', normal_balance: 'Debit' },
  ];

  for (const coa of coaItems) {
    const { error } = await supabase.from('accounts').upsert([coa], { onConflict: 'tenant_id,code' });
    console.log(error ? `   ❌ COA "${coa.code}": ${error.message}` : `   ✅ COA "${coa.code}" OK`);
  }

  // ─────────────────────────────────────────────
  // 7. SEED OUTLETS
  // ─────────────────────────────────────────────
  console.log('7️⃣  Seeding Outlets...');
  const { error: oErr } = await supabase.from('outlets').upsert([{
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Outlet Pusat',
    address: 'Jl. Sudirman No. 1, SCBD, Jakarta',
    tenant_id: TENANT_ID,
    is_active: true,
    latitude: -6.2088,
    longitude: 106.8456,
    geofence_radius: 200
  }], { onConflict: 'id' });
  console.log(oErr ? `   ❌ Outlet Error: ${oErr.message}` : '   ✅ Outlet OK');

  // ─────────────────────────────────────────────
  // 8. SEED SUPPLIERS
  // ─────────────────────────────────────────────
  console.log('8️⃣  Seeding Suppliers...');
  const suppliers = [
    { name: 'PT Kopi Nusantara', contact: '021-5551234', address: 'Jl. Kopi Raya No. 10, Bandung', tenant_id: TENANT_ID },
    { name: 'UD Susu Segar', contact: '021-5555678', address: 'Jl. Peternakan No. 5, Bogor', tenant_id: TENANT_ID },
  ];
  for (const s of suppliers) {
    const { error } = await supabase.from('suppliers').insert([s]);
    console.log(error ? `   ❌ Supplier "${s.name}": ${error.message}` : `   ✅ Supplier "${s.name}" OK`);
  }

  console.log('\n🏁 Seeding selesai! Silakan restart backend (npm run dev) dan refresh browser.');
  console.log('\n📋 Kredensial Login:');
  console.log('   SuperAdmin → username: superadmin / password: admin123');
  console.log('   Admin      → username: admin / password: admin123');
  console.log('   Kasir      → username: kasir / password: kasir123');
  console.log('\n📊 Chart of Accounts yang sudah di-seed:');
  console.log('   1-1000: Kas Tunai');
  console.log('   1-1010: Rekening Bank');
  console.log('   1-2000: Inventory');
  console.log('   2-1000: Accounts Payable');
  console.log('   2-1010: Hutang Pajak');
  console.log('   3-1000: Modal Pemilik');
  console.log('   4-1000: Pendapatan Penjualan');
  console.log('   5-1000: HPP / COGS');
  console.log('   5-2000: Beban Operasional');
}

seed().catch(console.error);
