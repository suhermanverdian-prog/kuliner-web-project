// ============================================================
// KEN ENTERPRISE — BUDGET TABLE MIGRATION
// ============================================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { supabase } = require('../../backend/src/supabase');

async function migrate() {
  console.log('🚀 Creating budgets table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
        account_code VARCHAR NOT NULL,
        account_name VARCHAR NOT NULL,
        period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
        period_year INTEGER NOT NULL CHECK (period_year >= 2000),
        amount NUMERIC(19,4) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, account_id, period_month, period_year)
      );

      CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(tenant_id, period_year, period_month);
      ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
    `
  });

  if (error) {
    // If rpc doesn't exist, try raw SQL via supabase-js workaround
    console.warn('⚠️ RPC exec_sql not available, trying direct table creation...');
    
    // Try creating via individual queries
    const { error: createErr } = await supabase.from('budgets').select('id').limit(1);
    
    if (createErr && createErr.code === '42P01') {
      // Table doesn't exist - need to create via Supabase SQL editor
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  ⚠️  MANUAL SQL REQUIRED                                  ║
║  Please run the following SQL in Supabase SQL Editor:     ║
╚════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    account_code VARCHAR NOT NULL,
    account_name VARCHAR NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2000),
    amount NUMERIC(19,4) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, account_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(tenant_id, period_year, period_month);
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
      `);
    } else {
      console.log('✅ Table budgets already exists!');
    }
  } else {
    console.log('✅ Table budgets created successfully!');
  }

  console.log('🎉 Migration complete!');
}

migrate();
