const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyAnalytics() {
    console.log('📊 FETCHING MONTHLY ANALYTICS SUMMARY...');
    
    const tenantId = '52fbacf9-4028-4f03-9de5-5754e5842458';
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total Revenue & Count
    const { data: txs } = await supabase.from('transactions')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString());

    const totalRevenue = (txs || []).reduce((s, t) => s + t.total, 0);
    const count = (txs || []).length;

    // 2. Journal Check (Revenue vs HPP)
    const { data: journals } = await supabase.from('journals')
        .select('total_debit')
        .eq('tenant_id', tenantId)
        .gte('date', thirtyDaysAgo.toISOString());
    
    const totalJournalDebit = (journals || []).reduce((s, j) => s + j.total_debit, 0);

    console.log('\n--- ANALYTICS REPORT ---');
    console.log(`✅ Total Transactions: ${count}`);
    console.log(`✅ Total Revenue: Rp ${totalRevenue.toLocaleString()}`);
    console.log(`✅ Total Journaled Revenue: Rp ${totalJournalDebit.toLocaleString()}`);
    console.log(`✅ Accuracy: ${totalRevenue === totalJournalDebit ? '100% MATCH' : 'DISCREPANCY DETECTED'}`);
    console.log('------------------------\n');
}

verifyAnalytics();
