const { supabase } = require('../src/supabase');

async function checkTables() {
  console.log("Checking tables in Supabase...");
  
  // Try querying materials first
  const { data: materials, error: mErr } = await supabase.from('bahan').select('*').limit(1);
  if (mErr) {
    console.error("Error reading 'bahan':", mErr.message);
  } else {
    console.log("Success reading 'bahan'! Columns:", Object.keys(materials[0] || {}));
  }

  // Try reading inventory_categories
  const { data: cats, error: cErr } = await supabase.from('inventory_categories').select('*').limit(1);
  if (cErr) {
    console.log("Table 'inventory_categories' does not exist yet (expected). Error:", cErr.message);
  } else {
    console.log("Table 'inventory_categories' exists! Columns:", Object.keys(cats[0] || {}));
  }
}

checkTables();
