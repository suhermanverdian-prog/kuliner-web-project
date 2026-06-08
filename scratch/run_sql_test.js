// scratch/run_sql_test.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Testing raw SQL via RPC...');
  // Coba jalankan alter table via RPC yang sering dipakai di Supabase: 'exec_sql' atau 'execute_sql'
  const { data, error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS access_scope TEXT DEFAULT \'outlet\';'
  });

  if (error) {
    console.error('exec_sql failed:', error.message);
    const { data: d2, error: e2 } = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS access_scope TEXT DEFAULT \'outlet\';'
    });
    if (e2) {
       console.error('execute_sql also failed:', e2.message);
    } else {
       console.log('execute_sql success!', d2);
    }
  } else {
    console.log('exec_sql success!', data);
  }
}

run();
