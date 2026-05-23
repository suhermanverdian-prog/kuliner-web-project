const { supabase } = require('../src/supabase');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('🔍 [Audit] Listing recent GRN and PO items...');

  // 1. Cloud GRN Items
  const { data: grnItems } = await supabase
    .from('grn_items')
    .select('*, bahan(name)')
    .order('grn_id', { ascending: false })
    .limit(10);
  console.log('\n☁️ Cloud GRN Items (Latest 10):', JSON.stringify(grnItems, null, 2));

  // 2. Local GRN Items
  const dataPath = path.resolve(__dirname, '../src/db/data.json');
  if (fs.existsSync(dataPath)) {
    const content = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(content);
    console.log('\n💾 Local GRN Items (Latest 10):', JSON.stringify((parsed.grn_items || []).slice(-10), null, 2));
    console.log('\n💾 Local POs (Latest 5):', JSON.stringify((parsed.purchase_orders || []).slice(-5), null, 2));
  }
}

run();
