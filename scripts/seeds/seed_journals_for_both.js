const { supabase } = require('../../backend/src/supabase');

const TENANT_IDS = [
  '00000000-0000-0000-0000-000000000000',
  'fba884db-967a-4e9f-bad8-79211f6b2cc6'
];

async function forceSeedJournals() {
  console.log("=== 🚀 FORCE SEEDING CORRECT JOURNALS FOR ALL TENANTS ===");

  for (const tenantId of TENANT_IDS) {
    console.log(`\nTenant ID: ${tenantId}`);

    // 1. Delete existing journals & journal lines for this tenant to start fresh
    const { error: delLinesErr } = await supabase.from('journal_lines').delete().eq('tenant_id', tenantId);
    if (delLinesErr) console.warn("Note deleting lines:", delLinesErr.message);

    const { error: delJournalsErr } = await supabase.from('journals').delete().eq('tenant_id', tenantId);
    if (delJournalsErr) console.warn("Note deleting journals:", delJournalsErr.message);

    // 2. Fetch Accounts to link properly
    const { data: accounts } = await supabase.from('accounts').select('id, code').eq('tenant_id', tenantId);
    
    const accInv = accounts?.find(a => a.code === '1-2000');
    const accAp = accounts?.find(a => a.code === '2-1000');
    const accCash = accounts?.find(a => a.code === '1-1000');
    const accRevenue = accounts?.find(a => a.code === '4-1000');
    const accCogs = accounts?.find(a => a.code === '5-1000');

    if (!accInv || !accAp || !accCash) {
      console.error("❌ Standard accounts are missing for this tenant! Seed accounts first.");
      continue;
    }

    // A. Journal 1: GRN (Penerimaan Persediaan)
    const { data: journal1, error: j1Err } = await supabase
      .from('journals')
      .insert([{
        tenant_id: tenantId,
        reference: 'GRN-984422',
        description: 'Penerimaan Persediaan Bahan Baku (PO: PO-001)',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        total_amount: 1500000
      }])
      .select()
      .single();

    if (j1Err) {
      console.error("❌ Failed to create Journal 1:", j1Err.message);
    } else {
      await supabase.from('journal_lines').insert([
        { tenant_id: tenantId, journal_id: journal1.id, account_id: accInv.id, account_code: '1-2000', account_name: 'Inventory / Persediaan Bahan Baku', debit: 1500000, credit: 0 },
        { tenant_id: tenantId, journal_id: journal1.id, account_id: accAp.id, account_code: '2-1000', account_name: 'Accounts Payable / Hutang Usaha', debit: 0, credit: 1500000 }
      ]);
      console.log("✅ Seeded Journal 1 (GRN)");
    }

    // B. Journal 2: Pembayaran Hutang
    const { data: journal2, error: j2Err } = await supabase
      .from('journals')
      .insert([{
        tenant_id: tenantId,
        reference: 'PAY-440021',
        description: 'Pelunasan Hutang Dagang atas Invoice INV-984422',
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        total_amount: 1500000
      }])
      .select()
      .single();

    if (j2Err) {
      console.error("❌ Failed to create Journal 2:", j2Err.message);
    } else {
      await supabase.from('journal_lines').insert([
        { tenant_id: tenantId, journal_id: journal2.id, account_id: accAp.id, account_code: '2-1000', account_name: 'Accounts Payable / Hutang Usaha', debit: 1500000, credit: 0 },
        { tenant_id: tenantId, journal_id: journal2.id, account_id: accCash.id, account_code: '1-1000', account_name: 'Kas Tunai', debit: 0, credit: 1500000 }
      ]);
      console.log("✅ Seeded Journal 2 (Payable Settlement)");
    }

    // C. Journal 3: Penjualan POS (Kasir)
    if (accRevenue && accCogs) {
      const { data: journal3, error: j3Err } = await supabase
        .from('journals')
        .insert([{
          tenant_id: tenantId,
          reference: 'POS-774029',
          description: 'Pendapatan Penjualan Harian POS - Shift Sore',
          date: new Date().toISOString(),
          total_amount: 850000
        }])
        .select()
        .single();

      if (j3Err) {
        console.error("❌ Failed to create Journal 3:", j3Err.message);
      } else {
        await supabase.from('journal_lines').insert([
          { tenant_id: tenantId, journal_id: journal3.id, account_id: accCash.id, account_code: '1-1000', account_name: 'Kas Tunai', debit: 850000, credit: 0 },
          { tenant_id: tenantId, journal_id: journal3.id, account_id: accRevenue.id, account_code: '4-1000', account_name: 'Pendapatan Penjualan', debit: 0, credit: 850000 },
          { tenant_id: tenantId, journal_id: journal3.id, account_id: accCogs.id, account_code: '5-1000', account_name: 'HPP / COGS', debit: 320000, credit: 0 },
          { tenant_id: tenantId, journal_id: journal3.id, account_id: accInv.id, account_code: '1-2000', account_name: 'Inventory / Persediaan Bahan Baku', debit: 0, credit: 320000 }
        ]);
        console.log("✅ Seeded Journal 3 (POS Sales)");
      }
    }
  }

  console.log("\n=== 🎉 FORCE SEED COMPLETE ===");
}

forceSeedJournals();
