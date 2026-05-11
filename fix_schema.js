
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixSchema() {
  console.log("🛠 Fixing Supabase Schema...");
  
  // Use SQL RPC to add column if not exists
  const { error } = await supabase.rpc('execute_sql', { sql_query: `
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
    ALTER TABLE grns ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
  `});

  if (error) {
    console.error("❌ SQL RPC failed (likely missing permissions):", error.message);
    console.log("Please run this SQL in Supabase Dashboard SQL Editor:");
    console.log("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';");
    console.log("ALTER TABLE grns ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';");
  } else {
    console.log("✅ Schema updated successfully!");
  }
}

fixSchema();
