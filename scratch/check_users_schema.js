// scratch/check_users_schema.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('🔍 Mengambil 1 data user untuk inspeksi kolom...');
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('❌ Gagal membaca tabel users:', error.message);
  } else if (!data || data.length === 0) {
    console.log('ℹ️ Tabel users kosong, mari kita insert dummy user untuk periksa schema.');
  } else {
    console.log('✅ Berhasil membaca tabel users! Daftar kolom yang ada:');
    console.log(Object.keys(data[0]));
    console.log('Sampel Data User:', data[0]);
  }
}

run();
