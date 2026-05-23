const { supabase } = require('../src/supabase');

async function run() {
  const targetId = 'd9c5d04b-d899-4e7c-a2fd-d8dbccce209d';
  console.log(`🔍 [Audit] Looking up material with ID: ${targetId}...`);
  
  const { data, error } = await supabase
    .from('bahan')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('\n📦 Material Found:', JSON.stringify(data, null, 2));
}

run();
