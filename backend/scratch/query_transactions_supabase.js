const { supabase } = require('../src/supabase');

async function run() {
  try {
    console.log('📡 Querying transactions from Supabase Cloud...');
    
    // 1. Transactions Count
    const { data: txs, error: txErr } = await supabase.from('transactions').select('*');
    if (txErr) throw txErr;
    console.log(`📊 Total rows in 'transactions' (headers): ${txs.length}`);
    if (txs.length > 0) {
      console.log('Sample Transaction Header:', JSON.stringify({
        id: txs[0].id,
        order_number: txs[0].order_number,
        total: txs[0].total,
        created_at: txs[0].created_at,
        items: txs[0].items
      }, null, 2));
    }

    // 2. Transaction Items Count
    const { data: txItems, error: itemErr } = await supabase.from('transaction_items').select('*');
    if (itemErr) throw itemErr;
    console.log(`📊 Total rows in 'transaction_items' (details): ${txItems.length}`);
    if (txItems.length > 0) {
      console.log('Sample Transaction Item Detail:', JSON.stringify(txItems[0], null, 2));
    } else {
      console.log('⚠️ Table transaction_items is completely empty in Supabase Cloud!');
    }

  } catch (err) {
    console.error('🚨 Error querying transactions from Supabase:', err.message);
  }
}

run();
