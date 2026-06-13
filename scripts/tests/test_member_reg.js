/**
 * ============================================================
 * KEN ENTERPRISE - TEST: Customer/Member Creation & Registration
 * ============================================================
 */

const http = require('http');
const jwt = require('jsonwebtoken');

const BASE_PORT = 3001;
const JWT_SECRET = 'super-secret-key-change-this-in-production';
const TENANT_ID  = '00000000-0000-0000-0000-000000000000';

// Generate Token
const CASHIER_TOKEN = jwt.sign(
  { id: '11111111-2222-3333-4444-555555555555', role: 'cashier', tenantId: TENANT_ID, name: 'Kasir Utama' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
      hostname: 'localhost', port: BASE_PORT,
      path: `/api${path}`, method,
      headers: headers
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

async function run() {
  console.log('--- STARTING CUSTOMER/MEMBER CREATION & REGISTRATION TESTS ---');

  const testPhoneCashier = '6289999999901';
  const testPhonePublic = '6289999999902';

  // Cleanup: In real system, phone number uniqueness is protected, so we use unique numbers or random ones.
  const rand1 = Math.floor(100000 + Math.random() * 900000);
  const rand2 = Math.floor(100000 + Math.random() * 900000);
  const phoneCashier = `62812${rand1}`;
  const phonePublic = `62812${rand2}`;

  // Test 1: Kasir menambahkan member baru (dengan token kasir)
  console.log('\n[TEST 1] Kasir menambahkan member baru...');
  const res1 = await req('POST', '/customers', {
    name: 'Member Baru dari Kasir',
    phone: phoneCashier,
    email: `kasir_member_${rand1}@example.com`
  }, CASHIER_TOKEN);

  console.log('Response Status:', res1.status);
  console.log('Response Data:', res1.data);
  if (res1.status === 201 && res1.data.id) {
    console.log('✅ TEST 1: BERHASIL (Kasir berhasil menambahkan member)');
  } else {
    console.log('❌ TEST 1: GAGAL');
  }

  // Test 2: Registrasi member di halaman pelanggan (tanpa token, public route / register / customer register)
  console.log('\n[TEST 2] Registrasi member dari halaman pelanggan...');
  // Let's test calling POST /customers but without Auth token, but passing x-tenant-id header.
  // Wait, does POST /customers allow guest register if x-tenant-id is provided?
  // Let's test calling it.
  const res2 = await req('POST', '/customers', {
    name: 'Pelanggan Self-Register',
    phone: phonePublic,
    email: `self_member_${rand2}@example.com`
  }, null); // null token

  console.log('Response Status:', res2.status);
  console.log('Response Data:', res2.data);
  if (res2.status === 201 && res2.data.id) {
    console.log('✅ TEST 2: BERHASIL (Registrasi halaman pelanggan berhasil)');
  } else {
    console.log('❌ TEST 2: GAGAL (Mungkin membutuhkan route public / register, mari cek)');
  }
}

run();
