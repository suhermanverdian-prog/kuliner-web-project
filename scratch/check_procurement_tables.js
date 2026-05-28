const { supabase } = require('../backend/src/supabase');

async function checkProcurement() {
    const tables = ['purchase_orders', 'purchase_order_items', 'grns', 'grn_items', 'purchase_invoices'];
    for (const t of tables) {
        console.log(`Checking table: ${t}`);
        try {
            const { data, error } = await supabase.from(t).select('*').limit(3);
            if (error) {
                console.error(`❌ Error querying table ${t}:`, error.message);
            } else {
                console.log(`✅ Table ${t} query successful. Found rows: ${data ? data.length : 0}`);
                console.log('Sample rows:', data);
            }
        } catch (e) {
            console.error(`💥 Exception querying table ${t}:`, e.message);
        }
        console.log('------------------------------');
    }
}

checkProcurement();
