const { supabase } = require('../src/supabase');

async function test() {
  try {
    console.log('📡 Testing transaction_items insertion...');
    
    // Fetch a valid transaction ID from the database
    const { data: txs, error: fetchErr } = await supabase.from('transactions').select('id, tenant_id').limit(1);
    if (fetchErr) throw fetchErr;
    if (txs.length === 0) {
      console.log('❌ No transactions found to link!');
      return;
    }
    
    const validTrxId = txs[0].id;
    const tenantId = txs[0].tenant_id;
    console.log(`🔗 Linking test item to Transaction ID: ${validTrxId}, Tenant: ${tenantId}`);

    // Fetch a valid menu ID
    const { data: menu, error: menuErr } = await supabase.from('menu').select('id').limit(1);
    if (menuErr) throw menuErr;
    if (menu.length === 0) {
      console.log('❌ No menu items found in cloud!');
      return;
    }
    const validMenuId = menu[0].id;
    console.log(`🍔 Linking test item to Menu ID: ${validMenuId}`);

    const dummyItem = {
      transaction_id: validTrxId,
      menu_id: validMenuId,
      qty: 1,
      price: 25000,
      tenant_id: tenantId
    };

    console.log('Inserting dummy item:', dummyItem);
    const { data, error: insertErr } = await supabase
      .from('transaction_items')
      .insert([dummyItem])
      .select();

    if (insertErr) {
      console.error('❌ Insert FAILED:', insertErr.message);
      console.error('Error Code:', insertErr.code);
      console.error('Details:', insertErr.details);
    } else {
      console.log('✅ Insert SUCCEEDED! Inserted data:', data);
      
      // Cleanup
      const { error: delErr } = await supabase.from('transaction_items').delete().eq('transaction_id', validTrxId);
      if (delErr) console.warn('⚠️ Cleanup failed:', delErr.message);
      else console.log('🧹 Cleanup successful.');
    }

  } catch (err) {
    console.error('🚨 Test error:', err.message);
  }
}

test();
