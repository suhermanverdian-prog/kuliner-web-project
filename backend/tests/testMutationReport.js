const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const { supabase } = require('../src/supabase');

async function testInspect() {
  const { data, error } = await supabase.from('inventory_logs').select('*').limit(1);
  if (error) {
    console.error("Error fetching logs:", error);
  } else if (data && data.length > 0) {
    console.log("Columns of inventory_logs:", Object.keys(data[0]));
    console.log("Sample row:", data[0]);
  } else {
    console.log("No rows in inventory_logs.");
  }
}

testInspect();
