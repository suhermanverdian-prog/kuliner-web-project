const { supabase } = require('../src/supabase');

async function test() {
  console.log('🚀 Simulating GRN Insert to Supabase...');
  
  const dummyGrn = {
    tenant_id: '00000000-0000-0000-0000-000000000000',
    po_id: '71dec433-7886-4294-a491-9973db710941',
    grn_number: 'GRN-TEST-123456',
    received_date: new Date().toISOString()
  };

  console.log('a. Inserting GRN header (no supplier_id)...');
  const { data: grn, error: grnErr } = await supabase
    .from('grns')
    .insert([dummyGrn])
    .select()
    .single();

  if (grnErr) {
    console.error('❌ GRN Header Insert Failed:', grnErr.message, '\nCode:', grnErr.code);
    return;
  }
  
  console.log('✅ GRN Header Inserted. ID:', grn.id);

  console.log('b. Inserting GRN items...');
  const dummyItem = {
    grn_id: grn.id,
    tenant_id: '00000000-0000-0000-0000-000000000000',
    bahan_id: '101',
    qty_received: 10,
    price_unit: 75000
  };

  const { error: itemsErr } = await supabase.from('grn_items').insert([dummyItem]);
  if (itemsErr) {
    console.error('❌ GRN Items Insert Failed:', itemsErr.message, '\nCode:', itemsErr.code);
  } else {
    console.log('✅ GRN Items Inserted successfully!');
  }

  // Cleanup
  console.log('c. Cleaning up dummy GRN...');
  await supabase.from('grn_items').delete().eq('grn_id', grn.id);
  await supabase.from('grns').delete().eq('id', grn.id);
  console.log('Cleanup completed.');
}

test().catch(console.error);
