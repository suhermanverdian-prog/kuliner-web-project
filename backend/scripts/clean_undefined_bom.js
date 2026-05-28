// clean_undefined_bom.js — Run once to sanitize existing BOM entries
// This script connects to Supabase, scans all materials (bahan),
// removes any BOM items that have undefined, null, "undefined" or "null" IDs,
// and ensures no stray supplier markers remain in the ingredient list.

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // use service role for admin updates

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBom() {
  const { data: bahanList, error } = await supabase
    .from('bahan')
    .select('id, name, bom')
    .neq('bom', null);

  if (error) {
    console.error('❌ Failed to fetch bahan:', error.message);
    return;
  }

  for (const bahan of bahanList) {
    const originalBom = bahan.bom || [];
    const cleanedBom = originalBom
      .filter(item => item && !item.isSupplierMarker) // drop supplier markers
      .filter(item => {
        const id = item.bahanId || item.bahan_id;
        return id && String(id) !== 'undefined' && String(id) !== 'null';
      })
      .map(item => ({
        ...item,
        // ensure only valid IDs survive
        bahanId: item.bahanId && String(item.bahanId) !== 'undefined' && String(item.bahanId) !== 'null' ? item.bahanId : undefined,
        bahan_id: item.bahan_id && String(item.bahan_id) !== 'undefined' && String(item.bahan_id) !== 'null' ? item.bahan_id : undefined
      }));

    if (cleanedBom.length !== originalBom.length) {
      const { error: updErr } = await supabase
        .from('bahan')
        .update({ bom: cleanedBom })
        .eq('id', bahan.id);

      if (updErr) {
        console.warn(`⚠️ Could not update bahan ${bahan.id} (${bahan.name}): ${updErr.message}`);
      } else {
        console.log(`✅ Cleaned BOM for bahan ${bahan.id} (${bahan.name}) – removed ${originalBom.length - cleanedBom.length} invalid entries.`);
      }
    }
  }
}

cleanBom()
  .then(() => console.log('✅ BOM sanitation complete'))
  .catch(err => console.error('❌ Unexpected error:', err));
