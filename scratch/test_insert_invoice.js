const { supabase } = require('../backend/src/supabase');

async function testInsert() {
    console.log('Testing insert with string id...');
    const payload1 = {
        id: 'inv-' + Date.now(),
        tenant_id: '00000000-0000-0000-0000-000000000000',
        total: 10000,
        status: 'unpaid'
    };
    const { error: error1 } = await supabase.from('purchase_invoices').insert([payload1]);
    if (error1) {
        console.error('❌ Insert with string id failed:', error1.message, error1.code);
    } else {
        console.log('✅ Insert with string id succeeded!');
    }

    console.log('\nTesting insert WITHOUT id (letting Supabase generate it)...');
    const payload2 = {
        tenant_id: '00000000-0000-0000-0000-000000000000',
        total: 20000,
        status: 'unpaid'
    };
    const { data: data2, error: error2 } = await supabase.from('purchase_invoices').insert([payload2]).select();
    if (error2) {
        console.error('❌ Insert without id failed:', error2.message, error2.code);
    } else {
        console.log('✅ Insert without id succeeded! Generated row:', data2);
    }
}

testInsert();
