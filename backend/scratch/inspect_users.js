const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspectUsers() {
  console.log('--- INSPEKSI TABEL USERS ---');
  // Try to insert a minimal row to see what works or check metadata
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.log('Error querying table:', error.message);
  } else {
    console.log('Table exists. Columns in first row (if any):', data[0] ? Object.keys(data[0]) : 'No data');
  }
}

inspectUsers();
