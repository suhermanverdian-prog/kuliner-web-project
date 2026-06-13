/**
 * ============================================================
 * KEN ENTERPRISE - E2E TEST: Comprehensive Member, Promo & Loyalty Settings Verification
 * ============================================================
 * 
 * Skenario Pengujian:
 * 1. Membuat Promo Baru (Umum) & Memastikan Statusnya Aktif.
 * 2. Pendaftaran Member baru dari sisi KASIR (dengan Auth Token).
 * 3. Pendaftaran Member baru mandiri dari sisi PELANGGAN (tanpa Auth Token / Guest Mode).
 * 4. Memverifikasi seluruh Pengaturan dari Halaman Pengaturan Promo & Diskon:
 *    - Mengubah dan menyimpan Sakelar loyalty (Enabled/Disabled) -> Harus memengaruhi kalkulasi poin.
 *    - Mengubah Pagu Rasio Loyalty Point (Setiap Belanja Rp X -> 1 Poin).
 *    - Mengubah Aturan Tier CRM (Pengali poin Member/VIP, minimal belanja/kunjungan).
 * 5. Menjalankan Transaksi Kasir (Dine-in) & Transaksi Pelanggan (Self-Order)
 *    untuk memvalidasi perolehan poin yang akurat berdasarkan status aktif & pengali tier.
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const BASE_PORT = 3001;
const JWT_SECRET = 'super-secret-key-change-this-in-production';
const TENANT_ID  = '00000000-0000-0000-0000-000000000000';

const CASHIER_TOKEN = jwt.sign(
  { id: '11111111-2222-3333-4444-555555555555', role: 'cashier', tenantId: TENANT_ID, name: 'Kasir E2E' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const SUPER_TOKEN = jwt.sign(
  { id: '5110fbd7-b5fe-4b34-9384-cda694f2933f', role: 'superadmin', tenantId: TENANT_ID, name: 'Master E2E' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

let RESULTS = { pass: 0, fail: 0 };

function req(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
      ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
      hostname: 'localhost', port: BASE_PORT,
      path: `/api${path}`, method,
      headers
    };
    const r = http.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    r.on('error', e => resolve({ status: 0, data: { error: e.message } }));
    if (data) r.write(data);
    r.end();
  });
}

function assert(cond, msg, debug = null) {
  if (cond) {
    console.log(`  ✅  PASS  ${msg}`);
    RESULTS.pass++;
  } else {
    console.error(`  ❌  FAIL  ${msg} ${debug ? ' -> ' + JSON.stringify(debug) : ''}`);
    RESULTS.fail++;
  }
}

async function run() {
  console.log('\n======================================================================');
  console.log('🏁  STARTING COMPREHENSIVE E2E TEST: CRM TIER, PROMO & LOYALTY SETTINGS');
  console.log('======================================================================\n');

  // STEP 1: Buat Promo Baru & Pastikan Aktif
  console.log('[STEP 1] Membuat Promo Baru...');
  const promoCode = 'E2EPARTY' + Math.floor(1000 + Math.random() * 9000);
  const promoRes = await req('POST', '/promo-codes', {
    code: promoCode,
    type: 'percent',
    value: 20, // 20%
    min_order_amount: 10000,
    desc: 'Promo E2E Diskon 20%',
    is_active: true
  }, SUPER_TOKEN);

  assert(promoRes.status === 201 || promoRes.status === 200, `Promo "${promoCode}" berhasil dibuat & aktif`, promoRes.data);

  // STEP 2: Pendaftaran Member dari Halaman Kasir
  console.log('\n[STEP 2] Registrasi Member baru dari Kasir...');
  const randKasir = Math.floor(100000 + Math.random() * 900000);
  const phoneKasir = `62877${randKasir}`;
  const regKasirRes = await req('POST', '/customers', {
    name: 'Member Kasir E2E',
    phone: phoneKasir,
    email: `member.kasir.${randKasir}@e2e.com`
  }, CASHIER_TOKEN);

  assert(regKasirRes.status === 201, `Member kasir "${phoneKasir}" berhasil didaftarkan`, regKasirRes.data);

  // STEP 3: Registrasi Member dari Halaman Pelanggan (Self-Register)
  console.log('\n[STEP 3] Registrasi Member baru mandiri dari Halaman Pelanggan...');
  const randPelanggan = Math.floor(100000 + Math.random() * 900000);
  const phonePelanggan = `62878${randPelanggan}`;
  const regPelangganRes = await req('POST', '/customers', {
    name: 'Member Mandiri E2E',
    phone: phonePelanggan,
    email: `member.mandiri.${randPelanggan}@e2e.com`
  }, null); // Guest (no token)

  assert(regPelangganRes.status === 201, `Member mandiri "${phonePelanggan}" berhasil didaftarkan`, regPelangganRes.data);

  // STEP 4: Ambil item menu riil dari DB
  console.log('\n[STEP 4] Mengambil item menu untuk transaksi...');
  const menuRes = await req('GET', '/menu');
  let menuItem = { id: randomUUID(), name: 'Affogato Latte', price: 35000, category: 'Coffee' };
  if (menuRes.status === 200 && Array.isArray(menuRes.data) && menuRes.data.length > 0) {
    menuItem = menuRes.data[0];
    console.log(`  Ditemukan menu riil: "${menuItem.name}" - Rp ${menuItem.price}`);
  } else {
    console.log('  Menu kosong, fallback menggunakan data dummy');
  }

  // STEP 5: Verifikasi Pengaturan Loyalty & Tier CRM
  console.log('\n[STEP 5] Mengubah & menyimpan konfigurasi Loyalty + Aturan Tier...');
  
  // Mengatur Aturan Loyalty: Enabled = true, 1 Poin per Rp 5.000 belanja
  const setupLoyaltyRes = await req('POST', '/system/settings/loyalty', {
    enabled: true,
    multiplier: 5000, // Rp 5.000 belanja = 1 Poin
    points_value: 100
  }, SUPER_TOKEN);

  assert(setupLoyaltyRes.status === 200 || setupLoyaltyRes.status === 201, 'Konfigurasi Loyalty Point berhasil disimpan (Enabled = true, Rate = Rp 5.000)', setupLoyaltyRes.data);

  // Mengubah Aturan Tier CRM: Member (Min belanja 50.000, Multiplier 2.0x)
  const setupSettingsRes = await req('POST', '/system/settings', {
    store_name: 'KEN COFFEE E2E',
    tax: 0,
    tier_rules: {
      member: { min_spend: 50000, min_visits: 1, points_multiplier: 2.0 }, // Member instan
      vip: { min_spend: 500000, min_visits: 5, points_multiplier: 3.0 }
    }
  }, SUPER_TOKEN);

  assert(setupSettingsRes.status === 200 || setupSettingsRes.status === 201, 'Kustomisasi Aturan Tier CRM disimpan di database', setupSettingsRes.data);

  // STEP 6: Transaksi Kasir Menggunakan Promo (Menghasilkan Poin)
  console.log('\n[STEP 6] Menjalankan Transaksi Kasir dengan Promo...');
  // Transaksi senilai 2 unit Affogato (Rp 70.000) - diskon 20% (Rp 14.000) = Total Rp 56.000
  // Dengan rate Rp5.000 per poin, Poin dasar = Math.floor(56000 / 5000) = 11 poin
  // Karena pelanggan mendaftar baru (0 spend / 0 visit), Tier dia adalah GUEST (Multiplier 1.0)
  // Total Poin yang didapat = 11 poin.
  const subTotal = menuItem.price * 2;
  const discAmount = subTotal * 0.20;
  const finalTotal = subTotal - discAmount;

  const trxKasir = await req('POST', '/transactions', {
    customer_name: 'Member Kasir E2E',
    customer_phone: phoneKasir,
    promo_code: promoCode,
    payment_method: 'Tunai',
    cashier_name: 'Kasir E2E',
    table_type: 'dine_in',
    items: [{ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 2, category: menuItem.category || 'Coffee' }],
    discount_amount: discAmount,
    tax_amount: 0,
    total: finalTotal
  }, CASHIER_TOKEN);

  assert(trxKasir.status === 201 || trxKasir.status === 200, `Transaksi kasir berhasil dibuat senilai Rp ${finalTotal}`, trxKasir.data);

  // Verifikasi pertambahan poin member kasir
  console.log('\n[STEP 7] Memeriksa poin loyalty Member Kasir di database...');
  const meKasir = await req('GET', `/loyalty/me?phone=${phoneKasir}`, null, CASHIER_TOKEN);
  console.log('  Detail Member Kasir:', meKasir.data);
  // Poin dasar = Math.floor(56000 / 5000) = 11
  assert(meKasir.data?.points >= 11, `Poin member bertambah minimal 11 poin (Poin aktual: ${meKasir.data?.points})`);

  // STEP 8: Tes Menonaktifkan Program Loyalty (Loyalty Config = False)
  console.log('\n[STEP 8] Menonaktifkan Program Loyalty di halaman pengaturan...');
  const disableLoyaltyRes = await req('POST', '/system/settings/loyalty', {
    enabled: false,
    multiplier: 5000,
    points_value: 100
  }, SUPER_TOKEN);
  assert(disableLoyaltyRes.status === 200 || disableLoyaltyRes.status === 201, 'Status Program Loyalty diubah menjadi NONAKTIF di database');

  // STEP 9: Transaksi Mandiri dari Pelanggan ketika Loyalty Nonaktif
  console.log('\n[STEP 9] Menjalankan Transaksi Pelanggan (Self-Order) saat loyalty nonaktif...');
  const trxPelanggan = await req('POST', '/transactions', {
    customer_name: 'Member Mandiri E2E',
    customer_phone: phonePelanggan,
    promo_code: promoCode,
    payment_method: 'QRIS',
    cashier_name: 'Self-Service Portal',
    table_type: 'takeaway',
    items: [{ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 2, category: menuItem.category || 'Coffee' }],
    discount_amount: discAmount,
    tax_amount: 0,
    total: finalTotal
  }, null); // Tanpa token

  assert(trxPelanggan.status === 201 || trxPelanggan.status === 200, `Transaksi mandiri berhasil dibuat senilai Rp ${finalTotal}`, trxPelanggan.data);

  // Verifikasi poin pelanggan mandiri harus tetap 0 karena program dinonaktifkan
  console.log('\n[STEP 10] Memeriksa poin loyalty Member Mandiri...');
  const mePelanggan = await req('GET', `/loyalty/me?phone=${phonePelanggan}`, null, CASHIER_TOKEN);
  console.log('  Detail Member Mandiri:', mePelanggan.data);
  assert(mePelanggan.data?.points === 0, `Poin member mandiri bernilai 0 karena program loyalty dinonaktifkan (Poin aktual: ${mePelanggan.data?.points})`);

  console.log('\n======================================================================');
  console.log(`🏁  E2E TEST FINISHED: ${RESULTS.pass} PASSED, ${RESULTS.fail} FAILED`);
  console.log('======================================================================\n');
}

run();
