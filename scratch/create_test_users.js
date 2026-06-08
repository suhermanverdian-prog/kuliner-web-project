// scratch/create_test_users.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

// UUID Outlet yang telah dibuat sebelumnya
const OUTLET_A_BANDUNG = '7a050e9b-11f6-464b-815a-160eb85c11b9';
const OUTLET_B_JAKARTA = '15041657-7013-4ac0-86c5-435a0e2aa8dd';
const TENANT_ID = 'fba884db-967a-4e9f-bad8-79211f6b2cc6'; // Main Store

async function run() {
  console.log('🚀 Menyiapkan pengguna uji coba untuk RLS...');

  try {
    const passwordHash = 'password_ken_123'; // login password

    // Hapus data lama jika ada
    await supabase.from('users').delete().in('username', ['mgr_bandung', 'mgr_jakarta', 'mgr_regional']);

    // 1. Manager Outlet A (Bandung)
    const { data: userA, error: errA } = await supabase.from('users').insert([
      {
        tenant_id: TENANT_ID,
        name: 'Manager Bandung',
        username: 'mgr_bandung',
        email: 'mgr.bandung@ken.node',
        password: passwordHash, // Standard plain for test login, or hashed if authMiddleware uses bcrypt
        role: 'manager',
        scope: 'outlet',
        allowed_outlets: [OUTLET_A_BANDUNG],
        is_active: true
      }
    ]).select().single();

    // 2. Manager Outlet B (Jakarta)
    const { data: userB, error: errB } = await supabase.from('users').insert([
      {
        tenant_id: TENANT_ID,
        name: 'Manager Jakarta',
        username: 'mgr_jakarta',
        email: 'mgr.jakarta@ken.node',
        password: passwordHash,
        role: 'manager',
        scope: 'outlet',
        allowed_outlets: [OUTLET_B_JAKARTA],
        is_active: true
      }
    ]).select().single();

    // 3. Manager Regional (Akses Bandung & Jakarta)
    const { data: userReg, error: errReg } = await supabase.from('users').insert([
      {
        tenant_id: TENANT_ID,
        name: 'Manager Regional',
        username: 'mgr_regional',
        email: 'mgr.regional@ken.node',
        password: passwordHash,
        role: 'manager',
        scope: 'regional',
        allowed_outlets: [OUTLET_A_BANDUNG, OUTLET_B_JAKARTA],
        is_active: true
      }
    ]).select().single();

    if (errA || errB || errReg) {
      console.error('❌ Gagal membuat user uji coba:', errA?.message || errB?.message || errReg?.message);
      return;
    }

    console.log('✅ Pengguna Uji Coba Berhasil Dibuat:');
    console.log(`👤 Manager Bandung   -> ID: ${userA.id} (Allowed: ${JSON.stringify(userA.allowed_outlets)})`);
    console.log(`👤 Manager Jakarta   -> ID: ${userB.id} (Allowed: ${JSON.stringify(userB.allowed_outlets)})`);
    console.log(`👤 Manager Regional  -> ID: ${userReg.id} (Allowed: ${JSON.stringify(userReg.allowed_outlets)})`);

  } catch (err) {
    console.error('❌ Error tak terduga:', err.message);
  }
}

run();
