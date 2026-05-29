const { supabase } = require('../../backend/src/supabase');

const TENANT_IDS = [
  '00000000-0000-0000-0000-000000000000',
  'fba884db-967a-4e9f-bad8-79211f6b2cc6'
];

const STANDARD_ACCOUNTS = [
  { code: '1-1000', name: 'Kas Tunai', category: 'Aset', normal_balance: 'Debit' },
  { code: '1-1010', name: 'Rekening Bank', category: 'Aset', normal_balance: 'Debit' },
  { code: '1-2000', name: 'Inventory / Persediaan Bahan Baku', category: 'Aset', normal_balance: 'Debit' },
  { code: '2-1000', name: 'Accounts Payable / Hutang Usaha', category: 'Kewajiban', normal_balance: 'Kredit' },
  { code: '2-1010', name: 'Hutang Pajak (PPN)', category: 'Kewajiban', normal_balance: 'Kredit' },
  { code: '3-1000', name: 'Modal Pemilik', category: 'Ekuitas', normal_balance: 'Kredit' },
  { code: '4-1000', name: 'Pendapatan Penjualan', category: 'Pendapatan', normal_balance: 'Kredit' },
  { code: '5-1000', name: 'HPP / COGS', category: 'Beban', normal_balance: 'Debit' },
  { code: '5-2000', name: 'Beban Operasional / Waste', category: 'Beban', normal_balance: 'Debit' }
];

async function seed() {
  console.log("=== 🚀 REPAIRING & SEEDING ACCOUNTING SYSTEM ===");

  for (const tenantId of TENANT_IDS) {
    console.log(`\nProcessing Tenant: ${tenantId}`);

    // 1. Seed Accounts (COA)
    for (const sa of STANDARD_ACCOUNTS) {
      // Check if account already exists for this tenant
      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('code', sa.code)
        .maybeSingle();

      if (!existing) {
        const { data: inserted, error } = await supabase
          .from('accounts')
          .insert([{
            tenant_id: tenantId,
            code: sa.code,
            name: sa.name,
            category: sa.category,
            normal_balance: sa.normal_balance,
            is_active: true
          }])
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to seed account ${sa.code}:`, error.message);
        } else {
          console.log(`✅ Seeded account: ${sa.code} - ${sa.name}`);
        }
      } else {
        console.log(`✔ Account already exists: ${sa.code}`);
      }
    }

    // 2. Clean up orphaned journal lines for this tenant
    const { error: delErr } = await supabase
      .from('journal_lines')
      .delete()
      .eq('tenant_id', tenantId)
      .is('journal_id', null);
    if (delErr) console.warn("Note deleting orphaned lines:", delErr.message);

    // 3. Seed a correct mock GRN and Cash Receipt journal to populate ledger beautifully
    const { data: existingJournals } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (!existingJournals || existingJournals.length === 0) {
      console.log("Seeding sample journal entries...");

      // A. GRN Journal
      const { data: journal1, error: j1Err } = await supabase
        .from('journals')
        .insert([{
          tenant_id: tenantId,
          reference: 'GRN-984422',
          description: 'Penerimaan Persediaan Bahan Baku (PO: PO-001)',
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
          total_amount: 1500000
        }])
        .select()
        .single();

      if (j1Err) {
        console.error("❌ Failed to seed Journal 1:", j1Err.message);
      } else {
        const { data: accInv } = await supabase.from('accounts').select('id').eq('tenant_id', tenantId).eq('code', '1-2000').single();
        const { data: accAp } = await supabase.from('accounts').select('id').eq('tenant_id', tenantId).eq('code', '2-1000').single();

        await supabase.from('journal_lines').insert([
          { tenant_id: tenantId, journal_id: journal1.id, account_id: accInv.id, account_code: '1-2000', account_name: 'Inventory / Persediaan Bahan Baku', debit: 1500000, credit: 0 },
          { tenant_id: tenantId, journal_id: journal1.id, account_id: accAp.id, account_code: '2-1000', account_name: 'Accounts Payable / Hutang Usaha', debit: 0, credit: 1500000 }
        ]);
        console.log("✅ Seeded GRN journal entry successfully!");
      }

      // B. Settlement Payable Journal
      const { data: journal2, error: j2Err } = await supabase
        .from('journals')
        .insert([{
          tenant_id: tenantId,
          reference: 'PAY-440021',
          description: 'Pelunasan Hutang Dagang atas Invoice INV-984422',
          date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
          total_amount: 1500000
        }])
        .select()
        .single();

      if (j2Err) {
        console.error("❌ Failed to seed Journal 2:", j2Err.message);
      } else {
        const { data: accAp } = await supabase.from('accounts').select('id').eq('tenant_id', tenantId).eq('code', '2-1000').single();
        const { data: accCash } = await supabase.from('accounts').select('id').eq('tenant_id', tenantId).eq('code', '1-1000').single();

        await supabase.from('journal_lines').insert([
          { tenant_id: tenantId, journal_id: journal2.id, account_id: accAp.id, account_code: '2-1000', account_name: 'Accounts Payable / Hutang Usaha', debit: 1500000, credit: 0 },
          { tenant_id: tenantId, journal_id: journal2.id, account_id: accCash.id, account_code: '1-1000', account_name: 'Kas Tunai', debit: 0, credit: 1500000 }
        ]);
        console.log("✅ Seeded Payable payment journal entry successfully!");
      }
    }
  }

  console.log("\n=== 🎉 REPAIR & SEED COMPLETE ===");
}

seed();
