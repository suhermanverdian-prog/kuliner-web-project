const { supabase } = require('../src/supabase');

async function check() {
  try {
    console.log('📡 Querying Postgres schema cache for transaction_items columns...');
    
    // We can run an RPC or we can do a dummy query or query the information schema if possible,
    // but the easiest way is to try an empty insert or fetch a single row and print its keys.
    // Wait, let's fetch the columns by querying pg_attribute or doing a raw postgres select.
    // If we don't have SQL execution tool, we can query Supabase's API.
    // Let's see what happens if we insert a dummy item WITHOUT tenant_id!
    
    const { data: txs } = await supabase.from('transactions').select('id').limit(1);
    const { data: menu } = await supabase.from('menu').select('id').limit(1);
    
    if (txs.length === 0 || menu.length === 0) {
      console.log('❌ Missing reference data.');
      return;
    }
    
    const testItem = {
      transaction_id: txs[0].id,
      menu_id: menu[0].id,
      qty: 1,
      price: 25000
    };
    
    console.log('Inserting WITHOUT tenant_id:', testItem);
    const { data, error } = await supabase.from('transaction_items').insert([testItem]).select();
    
    if (error) {
      console.error('❌ Insert FAILED:', error.message);
      console.error('Details:', error.details);
    } else {
      console.log('✅ Insert SUCCEEDED without tenant_id!');
      console.log('Inserted columns:', Object.keys(data[0]));
      
      // Cleanup
      await supabase.from('transaction_items').delete().eq('transaction_id', txs[0].id);
      console.log('🧹 Cleanup completed.');
    }
    
  } catch (err) {
    console.error('🚨 Error:', err.message);
  }
}

check();
