// scratch/setup_roles_test.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('🚀 Memulai inisialisasi lingkungan uji coba RLS...');

  try {
    // 1. Dapatkan tenant aktif pertama di platform
    const { data: tenants, error: tenantErr } = await supabase.from('tenants').select('id, name').limit(1);
    if (tenantErr || !tenants || tenants.length === 0) {
      console.error('❌ Gagal mendapatkan tenant:', tenantErr?.message || 'Tenant kosong');
      return;
    }
    const tenant = tenants[0];
    console.log(`✅ Menggunakan Tenant Uji Coba: ${tenant.name} (${tenant.id})`);

    // 2. Buat Outlet A dan Outlet B di bawah Tenant tersebut jika belum ada
    console.log('📦 Membuat outlet tambahan...');
    const { data: outletA, error: errA } = await supabase.from('outlets').upsert([
      { name: 'Outlet Bandung', tenant_id: tenant.id, is_active: true }
    ]).select().single();
    
    const { data: outletB, error: errB } = await supabase.from('outlets').upsert([
      { name: 'Outlet Jakarta', tenant_id: tenant.id, is_active: true }
    ]).select().single();

    if (errA || errB) {
      console.error('❌ Gagal membuat outlet:', errA?.message || errB?.message);
      return;
    }
    console.log(`✅ Outlet A Bandung: ${outletA.id}`);
    console.log(`✅ Outlet B Jakarta: ${outletB.id}`);

    // 3. Modifikasi kolom 'access_scope' dan 'allowed_outlets' pada tabel 'users' menggunakan REST API.
    // Catatan: Karena kita tidak memiliki akses SSH langsung ke CLI postgres, kita bisa menggunakan REST API Supabase untuk memverifikasi
    // atau jika Supabase memperbolehkan query SQL via RPC, kita bisa memanggilnya. Namun, jika kolom belum ada, kita bisa menambahkannya di dashboard 
    // atau menyuntikkan schema via SQL API.
    // Mari kita cek apakah kita memiliki RPC sql di supabase. Jika tidak, kita bisa langsung membuat user dan memasukkannya ke metadata feature_overrides atau ke dalam user.
    // Mari kita check apakah tabel 'users' memiliki kolom ini terlebih dahulu dengan melakukan select.
    const { data: columnsCheck, error: columnsError } = await supabase.from('users').select('access_scope, allowed_outlets').limit(1);
    if (columnsError) {
      console.log('⚠️ Kolom access_scope/allowed_outlets belum ada di tabel users. Kita perlu menambahkannya.');
      console.log('Saran: Gunakan Supabase SQL editor untuk menjalankan query:\n' +
                  'ALTER TABLE users ADD COLUMN IF NOT EXISTS access_scope TEXT DEFAULT \'outlet\';\n' +
                  'ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_outlets JSONB DEFAULT \'[]\';');
    } else {
      console.log('✅ Kolom access_scope dan allowed_outlets sudah ada di tabel users!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();
