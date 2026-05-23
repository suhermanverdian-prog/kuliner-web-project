const { supabase } = require('../src/supabase');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('⚡ [Self-Healing] Starting Macha Powder Stock Correction & Conversion Registry...');
  const machaId = 'd9c5d04b-d899-4e7c-a2fd-d8dbccce209d';
  const tenantId = '00000000-0000-0000-0000-000000000000';

  // 1. Add direct conversion rule: Dus -> Gram (Multiplier = 5000)
  console.log('📌 1. Adding direct conversion rule: Dus -> Gram (5000x)...');
  
  // Clean old direct conversions if any
  await supabase.from('unit_conversions')
    .delete()
    .eq('bahan_id', machaId)
    .eq('from_unit', 'Dus')
    .eq('to_unit', 'Gram');

  const { data: conv, error: cErr } = await supabase.from('unit_conversions')
    .insert([{
      tenant_id: tenantId,
      bahan_id: machaId,
      from_unit: 'Dus',
      to_unit: 'Gram',
      multiplier: 5000
    }])
    .select()
    .single();

  if (cErr) {
    console.error('❌ Error inserting conversion to Supabase:', cErr.message);
  } else {
    console.log('✅ Supabase Conversion Rule Created:', JSON.stringify(conv, null, 2));
  }

  // 2. Correct the stock in Supabase to 115,000 Grams
  const correctStock = 115000;
  console.log(`📌 2. Correcting stock of Macha Powder to ${correctStock} Grams...`);

  const { data: updatedBahan, error: bErr } = await supabase.from('bahan')
    .update({ stock: correctStock })
    .eq('id', machaId)
    .select()
    .single();

  if (bErr) {
    console.error('❌ Error updating stock in Supabase:', bErr.message);
  } else {
    console.log('✅ Supabase Stock Corrected:', JSON.stringify(updatedBahan, null, 2));
  }

  // 3. Sync to local data.json
  console.log('📌 3. Syncing to local data.json...');
  const dataPath = path.resolve(__dirname, '../src/db/data.json');
  if (fs.existsSync(dataPath)) {
    try {
      const content = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(content);

      // Save conversion locally
      const localConvs = parsed.unit_conversions || [];
      // Clean old ones
      const filteredConvs = localConvs.filter(c => 
        !(String(c.bahan_id) === String(machaId) && String(c.from_unit) === 'Dus' && String(c.to_unit) === 'Gram')
      );
      filteredConvs.push({
        id: 'conv-' + Date.now(),
        tenant_id: tenantId,
        bahan_id: machaId,
        from_unit: 'Dus',
        to_unit: 'Gram',
        multiplier: 5000,
        created_at: new Date().toISOString()
      });
      parsed.unit_conversions = filteredConvs;

      // Update local stock
      const localBahan = parsed.bahan || [];
      const idx = localBahan.findIndex(b => String(b.id) === String(machaId));
      if (idx >= 0) {
        localBahan[idx].stock = correctStock;
        parsed.bahan = localBahan;
        console.log(`✅ Local stock for Macha Powder corrected in data.json.`);
      } else {
        // If not present, inject it
        localBahan.push({
          id: machaId,
          tenant_id: tenantId,
          name: 'Macha Powder',
          category: 'Bahan Utama',
          unit: 'Gram',
          stock: correctStock,
          min_stock: 2000,
          cost: 800000,
          created_at: new Date().toISOString()
        });
        parsed.bahan = localBahan;
        console.log(`✅ Macha Powder injected and corrected in local data.json.`);
      }

      fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log('✅ Local data.json sync successfully completed.');
    } catch (e) {
      console.error('🚨 Local Sync Failed:', e.message);
    }
  }

  console.log('\n🚀 [Self-Healing Complete] Matcha stock corrected E2E!');
}

run();
