require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/supabase');

async function testFetch() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(2);
  const formatted = (data || []).map(t => {
    const meta = (t.items && !Array.isArray(t.items)) ? t.items : {};
    return {
      id: t.id,
      kdsStatus: meta.kds_status || 'new',
      items: Array.isArray(t.items) ? t.items : (meta.items || []),
      paymentStatus: t.payment_status
    };
  });
  console.log(JSON.stringify(formatted, null, 2));
}

testFetch();
