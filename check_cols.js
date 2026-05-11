
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'transactions' });
  
  if (error) {
    // If RPC doesn't exist, try simple select 1
    console.log("Checking transactions columns via select...");
    const { data: trx, error: err2 } = await supabase.from('transactions').select('*').limit(1);
    if (err2) console.error(err2);
    else console.log("Columns found:", Object.keys(trx[0] || {}));
  } else {
    console.log("Columns from RPC:", data);
  }
}

checkColumns();
