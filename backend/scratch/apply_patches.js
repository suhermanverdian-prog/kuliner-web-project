const { supabase } = require('../src/supabase');

async function run() {
  const sql = `
    -- A. Restrukturisasi Tabel transaction_items
    DROP TABLE IF EXISTS transaction_items CASCADE;
    CREATE TABLE transaction_items (
        id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        menu_id UUID REFERENCES menu(id) ON DELETE SET NULL,
        qty NUMERIC(19,4) NOT NULL,
        price NUMERIC(19,4) NOT NULL,
        subtotal NUMERIC(19,4) GENERATED ALWAYS AS (qty * price) STORED,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- B. Restrukturisasi Tabel grn_items
    DROP TABLE IF EXISTS grn_items CASCADE;
    CREATE TABLE grn_items (
        id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        grn_id UUID REFERENCES grns(id) ON DELETE CASCADE,
        bahan_id UUID REFERENCES bahan(id) ON DELETE SET NULL,
        qty_received NUMERIC(19,4) NOT NULL,
        price_unit NUMERIC(19,4) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('🛠 Sending SQL DDL via execute_sql RPC to Supabase...');
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
  if (error) {
    console.error('❌ SQL Execution failed:', error.message);
  } else {
    console.log('✅ SQL DDL patches applied successfully!');
  }
}

run();
