const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  // Let's do a dummy insert to get the error description or see the table metadata
  const { data, error } = await supabase.from('activity_logs').insert([{}]).select();
  console.log("Insert result:", data);
  console.log("Insert error:", error);
}

check();
