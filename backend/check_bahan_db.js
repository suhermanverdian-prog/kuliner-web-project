const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkBahan() {
  try {
    console.log('--- 🔍 DATABASE CHECK: BAHAN ---');
    const { data, error } = await supabase.from('bahan').select('*');
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    console.log(`📊 Total Bahan: ${data.length} items`);
    data.forEach(b => {
      console.log(` - ${b.name} | Tenant: ${b.tenant_id} | ID: ${b.id}`);
    });
  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

checkBahan();
