const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUsers() {
  console.log('--- PENGECEKAN TABEL USERS ---');
  const { data, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('⚠️ Tabel USERS masih KOSONG.');
  } else {
    console.log(`✅ Ditemukan ${data.length} user:`);
    data.forEach(u => {
      console.log(`- Username: [${u.username}], Role: [${u.role}], Password: [${u.password}]`);
    });
  }
}

checkUsers();
