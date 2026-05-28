const { supabase } = require('../backend/src/supabase');

async function checkColumns() {
    console.log('Fetching one row from purchase_invoices to inspect columns...');
    const { data, error } = await supabase.from('purchase_invoices').select('*').limit(1);
    if (error) {
        console.error('❌ Error querying purchase_invoices:', error.message);
    } else {
        console.log('✅ Query successful. Found row:', data);
        if (data && data.length > 0) {
            console.log('Columns in live DB:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Let\'s try to insert a test row to see if paid_at exists.');
            const { error: insError } = await supabase.from('purchase_invoices').insert([{
                tenant_id: '00000000-0000-0000-0000-000000000000',
                total: 0,
                status: 'paid',
                paid_at: new Date().toISOString()
            }]);
            if (insError) {
                console.error('❌ Insert test failed. Error:', insError.message, insError.code);
            } else {
                console.log('✅ Insert test with paid_at succeeded! paid_at column exists in database!');
                // Delete the test row
                await supabase.from('purchase_invoices').delete().eq('total', 0).eq('status', 'paid');
            }
        }
    }
}

checkColumns();
