const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/backend/.env' });

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
