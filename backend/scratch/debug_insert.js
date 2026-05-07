const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debugInsert() {
  console.log('Mencoba insert minimal (hanya username & password)...');
  const { data, error } = await supabase.from('users').insert([
    { 
      username: 'admin', 
      password: 'admin123',
      role: 'admin'
    }
  ]).select();

  if (error) {
    console.log('❌ Gagal:', error.message);
  } else {
    console.log('✅ BERHASIL!');
  }
}

debugInsert();
