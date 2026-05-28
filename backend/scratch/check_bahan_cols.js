const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('bahan').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Bahan columns:", data.length > 0 ? Object.keys(data[0]) : "No data in bahan table");
  }
}

run();
