const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createAdmin() {
  console.log('Sedang memasukkan user admin...');
  const { data, error } = await supabase.from('users').insert([
    { 
      name: 'Admin Utama', 
      username: 'admin', 
      password: 'admin123', 
      role: 'admin', 
      avatar: 'AU' 
    }
  ]).select();

  if (error) {
    console.log('❌ Gagal:', error.message);
  } else {
    console.log('✅ BERHASIL! User admin sudah dibuat.');
    console.log('Sekarang silakan login menggunakan:');
    console.log('Username: admin');
    console.log('Password: admin123');
  }
}

createAdmin();
