require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/supabase');

async function testFetch() {
  const { data } = await supabase.from('transactions').select('id, tenant_id, customer_name, payment_status').order('created_at', { ascending: false }).limit(5);
  console.table(data);
}
testFetch();
