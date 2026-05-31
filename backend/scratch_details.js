const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkDetails() {
  try {
    const { data: matcha } = await supabase.from('bahan').select('*').eq('name', 'Matcha Powder Premium').single();
    const { data: oat } = await supabase.from('bahan').select('*').eq('name', 'Oat Milk Barista Edition').single();
    console.log('Matcha details:', JSON.stringify(matcha, null, 2));
    console.log('Oat details:', JSON.stringify(oat, null, 2));
  } catch (e) {
    console.error(e);
  }
}
checkDetails();
