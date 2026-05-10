const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('Checking transactions...');
  const { data: txs } = await supabase.from('transactions').select('id').limit(10);
  console.log('Sample Transactions:', txs);

  console.log('Checking transaction_items...');
  const { data: items } = await supabase.from('transaction_items').select('*').limit(10);
  console.log('Sample Items:', items);

  if (txs && items) {
    const txIds = txs.map(t => t.id);
    const itemTxIds = items.map(i => i.transaction_id);
    console.log('Transaction IDs:', txIds);
    console.log('Item-referenced Transaction IDs:', itemTxIds);
  }
}

debug();
