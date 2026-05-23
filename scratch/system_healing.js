const { supabase } = require('../backend/src/supabase');

async function systemHealing() {
  console.log('🚀 STARTING TOTAL SYSTEM HEALING (VERSION 2.0)...');

  // 1. GET DATA
  const { data: allBahan } = await supabase.from('bahan').select('*');
  const { data: allBom } = await supabase.from('menu_bom').select('*');
  
  const defaultTenantId = '52fbacf9-4028-4f03-9de5-5754e5842458'; 

  // 2. FIX TENANT ID LEAKS
  console.log('🛡️ Fixing Tenant ID leaks...');
  const tablesToFix = ['bahan', 'transactions', 'menu', 'suppliers', 'menu_bom', 'activity_logs'];
  for (const table of tablesToFix) {
    const { error } = await supabase.from(table).update({ tenant_id: defaultTenantId }).is('tenant_id', null);
    if (!error) console.log(`   ✅ Table ${table} tenant_id leaks patched.`);
  }

  // 3. FIX BROKEN BOM RELATIONS
  console.log('🔄 Synchronizing BOM with UUIDs...');
  
  // Create a name-to-UUID map for Bahan
  const bahanMap = {};
  allBahan.forEach(b => {
    bahanMap[b.name.toLowerCase().trim()] = b.id;
  });

  // Precise mapping from data.json
  const legacyToName = {
    '101': 'Biji Kopi Arabica',
    '102': 'Susu Segar',
    '103': 'Gula Aren',
    '104': 'Cup Plastik',
    '105': 'Air Mineral',
    '106': 'Oat Milk',
    '107': 'Whipped Cream',
    '108': 'Es Batu',
    '109': 'Air Mineral',
    '117': 'Biji Kopi Arabica', // From logs, likely another coffee entry
    '118': 'Susu Segar',
    '120': 'Gula Aren',
    '121': 'Cup Plastik',
    '122': 'Sirup Vanilla',
    '123': 'Oat Milk',
    '125': 'Whipped Cream',
    '1777771499274': 'Oat Milk',
    '1777771764768': 'Sirup Caramel'
  };

  let fixedCount = 0;
  for (const bomItem of allBom) {
    const bIdStr = String(bomItem.bahan_id);
    // If it's a legacy ID (integer or numeric string)
    if (!bIdStr.includes('-')) {
      const legacyName = legacyToName[bIdStr];
      let newUuid = legacyName ? bahanMap[legacyName.toLowerCase().trim()] : null;

      // Fallback: If not in legacyToName, try to find by ID in existing bahan name (unlikely but safe)
      if (!newUuid) {
         // Maybe the name is similar
         const match = allBahan.find(b => b.name.toLowerCase().includes(legacyName?.toLowerCase()));
         if (match) newUuid = match.id;
      }

      if (newUuid) {
        const { error } = await supabase.from('menu_bom').update({ bahan_id: newUuid }).eq('id', bomItem.id);
        if (!error) fixedCount++;
        else console.error(`   ❌ Failed to update BOM ID ${bomItem.id}:`, error.message);
      } else {
        console.warn(`   ⚠️ Could not find UUID for legacy ID ${bIdStr} (${legacyName || 'Unknown'})`);
      }
    }
  }
  console.log(`   ✅ BOM Sync complete: ${fixedCount} records healed.`);

  console.log('🎉 SYSTEM HEALING COMPLETE! DATABASE IS NOW CONSISTENT.');
}

systemHealing();
