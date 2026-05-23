require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/supabase');

async function checkTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, unique_code, total, items, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('Error fetching transactions:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkTransactions();
