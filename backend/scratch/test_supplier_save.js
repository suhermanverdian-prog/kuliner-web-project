const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const InventoryService = require('../src/services/inventoryService');

async function test() {
  console.log("=== Testing Supplier Virtual Mapping Save/Load ===");
  const tenantId = '00000000-0000-0000-0000-000000000000';
  
  // 1. Get existing suppliers to pick one
  const { supabase } = require('../src/supabase');
  const { data: suppliers } = await supabase.from('suppliers').select('*').limit(1);
  if (!suppliers || suppliers.length === 0) {
    console.error("No suppliers found in database to run test.");
    return;
  }
  const selectedSupplier = suppliers[0];
  console.log(`Selected Supplier: [${selectedSupplier.name}] with ID: [${selectedSupplier.id}]`);

  // 2. Create a test material with the supplier_id
  const testMaterialName = 'Test Virtual Supplier ' + Math.floor(Math.random() * 1000);
  const bahanData = {
    name: testMaterialName,
    category: 'Sirup',
    unit: 'botol',
    price: 45000,
    min_stock: 3,
    stock: 10,
    supplier_id: selectedSupplier.id,
    bom: []
  };

  console.log(`Creating test material: [${testMaterialName}]...`);
  const createdBahan = await InventoryService.createInventory(bahanData, [], tenantId);
  console.log("Created Bahan ID:", createdBahan.id);

  // 3. Fetch all inventory and verify if the created bahan has the correct supplier mapped!
  console.log("Fetching all inventory to verify mapping...");
  const allBahan = await InventoryService.getAllInventory(tenantId, 'admin');
  const mappedBahan = allBahan.find(b => b.id === createdBahan.id);

  if (mappedBahan) {
    console.log("✅ Found created material in list!");
    console.log("Mapped supplier_id:", mappedBahan.supplier_id);
    console.log("Mapped supplier name:", mappedBahan.supplier?.name);
    if (mappedBahan.supplier_id === selectedSupplier.id && mappedBahan.supplier?.id === selectedSupplier.id) {
      console.log("🎉 SUCCESS: Virtual supplier mapping is 100% CORRECT!");
    } else {
      console.error("❌ FAILURE: Supplier was not correctly mapped!");
    }
  } else {
    console.error("❌ FAILURE: Material was not found in the list!");
  }

  // Cleanup: Delete the test material
  console.log("Cleaning up test material...");
  await supabase.from('bahan').delete().eq('id', createdBahan.id);
  console.log("Cleanup done.");
}

test().catch(console.error);
