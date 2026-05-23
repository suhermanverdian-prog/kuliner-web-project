const { supabase } = require('../src/supabase');

async function run() {
  const targetId = 'd9c5d04b-d899-4e7c-a2fd-d8dbccce209d';
  console.log(`🔍 [Audit] Checking conversions for Macha Powder (${targetId})...`);
  
  const { data, error } = await supabase
    .from('unit_conversions')
    .select('*')
    .eq('bahan_id', targetId);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('\n🔄 Conversions Found for Macha Powder:', JSON.stringify(data, null, 2));
}

run();
