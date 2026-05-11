const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createShiftTable() {
  console.log("🛠 Creating 'shifts' table...");
  const { error } = await supabase.rpc('execute_sql', { sql_query: `
    CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        outlet_id UUID REFERENCES outlets(id),
        user_name VARCHAR NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR DEFAULT 'open',
        open_cash NUMERIC DEFAULT 0,
        current_sales NUMERIC DEFAULT 0,
        current_cash NUMERIC DEFAULT 0,
        current_qris NUMERIC DEFAULT 0,
        total_sales NUMERIC DEFAULT 0,
        total_cash NUMERIC DEFAULT 0,
        total_qris NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
  `});

  if (error) {
    console.error("❌ SQL RPC failed:", error.message);
    console.log("⚠️ Please run the following SQL manually in Supabase SQL Editor:");
    console.log(`
    CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        outlet_id UUID REFERENCES outlets(id),
        user_name VARCHAR NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR DEFAULT 'open',
        open_cash NUMERIC DEFAULT 0,
        current_sales NUMERIC DEFAULT 0,
        current_cash NUMERIC DEFAULT 0,
        current_qris NUMERIC DEFAULT 0,
        total_sales NUMERIC DEFAULT 0,
        total_cash NUMERIC DEFAULT 0,
        total_qris NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
    `);
  } else {
    console.log("✅ 'shifts' table created successfully!");
  }
}

createShiftTable();
