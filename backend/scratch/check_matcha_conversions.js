const { supabase } = require('../src/supabase');

async function run() {
  console.log('🔍 [Audit] Checking database materials and conversions...');
  
  // 1. Fetch Matcha materials
  const { data: materials, error: mErr } = await supabase
    .from('bahan')
    .select('*')
    .ilike('name', '%matcha%');

  if (mErr) {
    console.error('❌ Error fetching materials:', mErr.message);
    return;
  }

  console.log('\n📦 Matcha Materials Found:', JSON.stringify(materials, null, 2));

  if (materials && materials.length > 0) {
    const ids = materials.map(m => m.id);
    
    // 2. Fetch conversions for these materials
    const { data: conversions, error: cErr } = await supabase
      .from('unit_conversions')
      .select('*')
      .in('bahan_id', ids);

    if (cErr) {
      console.error('❌ Error fetching conversions:', cErr.message);
      return;
    }

    console.log('\n🔄 Unit Conversions Found for Matcha:', JSON.stringify(conversions, null, 2));
  } else {
    console.log('⚠️ No Matcha materials found in the cloud database.');
  }
}

run();
