const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  console.log("Adding supplier_id column to bahan table...");
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: `
    ALTER TABLE bahan ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
  `});

  if (error) {
    console.error("Error executing SQL:", error.message);
  } else {
    console.log("Successfully updated schema!", data);
  }
}

run();
