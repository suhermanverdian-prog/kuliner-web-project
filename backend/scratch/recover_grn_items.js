const fs = require('fs');
const path = require('path');
const { supabase } = require('../src/supabase');

const dataPath = path.join(__dirname, '../src/db/data.json');

async function recover() {
  try {
    console.log('📡 Fetching all synced GRNs from Supabase Cloud...');
    const { data: cloudGrns, error: grnsErr } = await supabase
      .from('grns')
      .select('id, grn_number, received_date');
      
    if (grnsErr) throw grnsErr;
    console.log(`📊 Found ${cloudGrns.length} GRNs in Supabase Cloud.`);

    console.log('📂 Reading local data.json...');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ local data.json not found at:', dataPath);
      return;
    }

    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    const localGrnItems = parsed.grn_items || [];

    console.log(`📊 Found ${localGrnItems.length} orphaned grn_items in data.json.`);
    if (localGrnItems.length === 0) {
      console.log('✅ No items to recover.');
      return;
    }

    const itemsToInsert = [];
    const successfullySyncedIds = [];

    for (const item of localGrnItems) {
      const localGrnId = item.grn_id;
      if (!localGrnId.startsWith('grn-')) {
        console.warn(`⚠️ Skipped item ${item.id} because grn_id format is unexpected:`, localGrnId);
        continue;
      }

      // Parse timestamp from local id: e.g. "grn-1779045273808" -> 1779045273808
      const timestamp = Number(localGrnId.replace('grn-', ''));
      if (isNaN(timestamp)) {
        console.warn(`⚠️ Skipped item ${item.id} due to invalid timestamp:`, localGrnId);
        continue;
      }

      // Find the matching cloud GRN where received_date timestamp matches (with 100ms tolerance)
      const matchingCloudGrn = cloudGrns.find(g => {
        const cloudTime = new Date(g.received_date).getTime();
        return Math.abs(cloudTime - timestamp) <= 100;
      });

      if (!matchingCloudGrn) {
        console.warn(`❌ No matching cloud GRN found for local grn_id: ${localGrnId} (Timestamp: ${timestamp})`);
        continue;
      }

      console.log(`✨ Mapped Local Item: ${item.id} -> Cloud GRN: ${matchingCloudGrn.grn_number} (${matchingCloudGrn.id})`);

      itemsToInsert.push({
        tenant_id: item.tenant_id || '00000000-0000-0000-0000-000000000000',
        grn_id: matchingCloudGrn.id,
        bahan_id: item.bahan_id,
        qty_received: item.qty_received
      });

      successfullySyncedIds.push(item.id);
    }

    console.log(`\n🚀 Attempting to insert ${itemsToInsert.length} items into Supabase 'grn_items'...`);
    if (itemsToInsert.length > 0) {
      const { data, error: insertErr } = await supabase
        .from('grn_items')
        .insert(itemsToInsert)
        .select();

      if (insertErr) {
        throw insertErr;
      }

      console.log(`✅ Successfully inserted ${data?.length || itemsToInsert.length} rows into Supabase Cloud 'grn_items'!`);

      // Filter out successfully synced items from data.json
      const remainingItems = localGrnItems.filter(item => !successfullySyncedIds.includes(item.id));
      parsed.grn_items = remainingItems;

      fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log(`💾 Updated local data.json. Remaining grn_items: ${remainingItems.length}`);
    }

  } catch (err) {
    console.error('🚨 Error recovering grn_items:', err.message);
  }
}

recover();
