const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkBahan() {
  const { data, error } = await supabase.from('bahan').select('id, name').limit(5);
  if (error) {
    console.error('Error fetching bahan:', error.message);
  } else {
    console.log('Sample bahan found:', data);
  }
}

checkBahan();
