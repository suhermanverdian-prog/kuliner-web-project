const fs = require('fs');
const path = require('path');

function run() {
  console.log('🔍 [Audit] Scanning local data.json for Matcha...');
  const dataPath = path.resolve(__dirname, '../src/db/data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data.json not found!');
    return;
  }

  const content = fs.readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(content);

  // 1. Search in purchase_orders
  const poList = parsed.purchase_orders || [];
  const matchaPOs = poList.filter(po => {
    return po.items && po.items.some(item => 
      String(item.bahanId) === 'bb3a1794-7146-49be-950e-18b0aa36cc41' || 
      String(item.bahan_id) === 'bb3a1794-7146-49be-950e-18b0aa36cc41' ||
      (item.bahanName && item.bahanName.toLowerCase().includes('matcha'))
    );
  });

  console.log('\n📦 Matcha POs in Local DB:', JSON.stringify(matchaPOs, null, 2));

  // 2. Search in grn_items
  const grnItemsList = parsed.grn_items || [];
  const matchaGRNItems = grnItemsList.filter(gi => 
    String(gi.bahan_id) === 'bb3a1794-7146-49be-950e-18b0aa36cc41' ||
    String(gi.bahanId) === 'bb3a1794-7146-49be-950e-18b0aa36cc41'
  );

  console.log('\n🚚 Matcha GRN Items in Local DB:', JSON.stringify(matchaGRNItems, null, 2));

  // 3. Search in bahan
  const bahanList = parsed.bahan || [];
  const matchaBahan = bahanList.filter(b => 
    b.name && b.name.toLowerCase().includes('matcha')
  );
  console.log('\n📊 Matcha Bahan in Local DB:', JSON.stringify(matchaBahan, null, 2));
}

run();
