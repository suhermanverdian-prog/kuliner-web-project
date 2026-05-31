const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkBatches() {
  try {
    const { data: batches, error } = await supabase.from('inventory_batches').select('*');
    if (error) throw error;
    console.log('=== INVENTORY BATCHES ===');
    console.log(batches);
  } catch (e) {
    console.error(e);
  }
}
checkBatches();
