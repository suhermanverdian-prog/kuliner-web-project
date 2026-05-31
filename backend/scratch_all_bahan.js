const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkAllBahan() {
  try {
    const { data: bahan, error } = await supabase.from('bahan').select('*');
    if (error) throw error;
    console.log('=== BAHAN DB DETAILS ===');
    bahan.forEach(b => {
      console.log(`- ${b.name}: unit=${b.unit}, cost=${b.cost}, stock=${b.stock}, storageType=${b.storageType}`);
    });
  } catch (e) {
    console.error(e);
  }
}
checkAllBahan();
