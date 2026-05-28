const { supabase } = require('../src/supabase');

async function runMigration() {
  console.log("🚀 Running Assembly & Dynamic Categories SQL Migration...");

  const sql = `
    -- 1. Create inventory_categories table
    CREATE TABLE IF NOT EXISTS inventory_categories (
        id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
    );

    -- 2. Add bom column to bahan table
    ALTER TABLE bahan ADD COLUMN IF NOT EXISTS bom JSONB DEFAULT '[]';

    -- 3. Populate inventory_categories with existing categories from bahan
    INSERT INTO inventory_categories (tenant_id, name)
    SELECT DISTINCT tenant_id, category FROM bahan 
    WHERE category IS NOT NULL AND category != ''
    ON CONFLICT (tenant_id, name) DO NOTHING;
  `;

  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

  if (error) {
    console.error("❌ SQL Migration failed:", error.message);
    console.log("\nPlease run this SQL in Supabase Dashboard SQL Editor manually:\n");
    console.log(sql);
  } else {
    console.log("✅ SQL Migration completed successfully!");
  }
}

runMigration();
