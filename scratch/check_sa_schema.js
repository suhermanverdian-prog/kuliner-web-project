require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const tables = ['users', 'roles', 'tenants', 'audit_logs', 'feature_flags', 'api_keys', 'webhooks'];

async function checkDetails() {
  console.log("=== SUPABASE SCHEMA EXTENSIONS AUDIT ===");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: ERROR or DOES NOT EXIST (${error.message})`);
    } else {
      const keys = data && data.length > 0 ? Object.keys(data[0]) : [];
      console.log(`✅ Table [${table}]: ACTIVE (Columns: ${keys.join(', ') || 'Empty (no rows to infer columns)'})`);
    }
  }
}

checkDetails();
