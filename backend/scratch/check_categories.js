require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/supabase');

async function checkCategories() {
  const { data: tables, error } = await supabase.rpc('get_tables'); 
  // Wait, RPC might not exist. Let's just query some common names.
  const commonNames = ['categories', 'menu_categories', 'kategori'];
  for (const name of commonNames) {
    const { error: err } = await supabase.from(name).select('*').limit(1);
    if (!err || (err && err.code !== '42P01')) { // 42P01 is relation does not exist
      console.log(`Table '${name}' exists! Error:`, err ? err.message : 'None');
    } else {
      console.log(`Table '${name}' does NOT exist.`);
    }
  }
}
checkCategories();
