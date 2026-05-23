const { supabase } = require('../src/supabase');

async function run() {
  console.log('⚡ [Self-Healing] Updating existing conversion rule in Supabase...');
  const machaId = 'd9c5d04b-d899-4e7c-a2fd-d8dbccce209d';

  const { data, error } = await supabase.from('unit_conversions')
    .update({
      to_unit: 'Gram',
      multiplier: 5000
    })
    .eq('bahan_id', machaId)
    .eq('from_unit', 'Dus')
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating Supabase conversion rule:', error.message);
  } else {
    console.log('✅ Supabase Conversion Rule Successfully Updated:', JSON.stringify(data, null, 2));
  }
}

run();
