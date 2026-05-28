const { supabase } = require('./backend/src/supabase');

async function auditData() {
  console.log("=== 🔍 SUPABASE AUDIT ===");

  // 1. Audit accounts for all tenants
  const { data: accounts } = await supabase.from('accounts').select('id, tenant_id, code, name');
  console.log(`\n--- ACCOUNTS (${accounts?.length || 0}) ---`);
  accounts?.forEach(a => {
    console.log(`Account: ${a.code} - ${a.name} | Tenant: ${a.tenant_id}`);
  });

  // 2. Audit journals
  const { data: journals } = await supabase.from('journals').select('id, tenant_id, description, total, date');
  console.log(`\n--- JOURNALS (${journals?.length || 0}) ---`);
  journals?.forEach(j => {
    console.log(`Journal: ${j.description} | Total: ${j.total} | Date: ${j.date} | Tenant: ${j.tenant_id}`);
  });

  // 3. Audit journal lines
  const { data: lines } = await supabase.from('journal_lines').select('id, tenant_id, account_code, debit, credit');
  console.log(`\n--- JOURNAL LINES (${lines?.length || 0}) ---`);
  lines?.forEach(l => {
    console.log(`Line: ${l.account_code} | Dr: ${l.debit} | Cr: ${l.credit} | Tenant: ${l.tenant_id}`);
  });
}

auditData();
