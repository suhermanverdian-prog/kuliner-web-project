// scratch/check_tables_outlet_column.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const tables = ['transactions', 'journal_lines', 'bahan', 'inventory_logs'];
  console.log('🔍 Memulai verifikasi kolom outlet_id pada tabel-tabel penting...');
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Tabel "${table}" Error:`, error.message);
    } else if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const hasOutletId = columns.includes('outlet_id');
      console.log(`📊 Tabel "${table}" -> Has outlet_id: ${hasOutletId ? '✅ YA' : '❌ TIDAK'} (Daftar Kolom: ${columns.slice(0, 5).join(', ')}...)`);
    } else {
      console.log(`ℹ️ Tabel "${table}" kosong, tidak bisa di-inspect.`);
    }
  }
}

run();
