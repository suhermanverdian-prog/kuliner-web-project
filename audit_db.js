const { supabase } = require('./backend/src/supabase');

async function auditDatabase() {
    console.log('🔍 KEN ERP DATABASE AUDIT\n');
    
    const tables = [
        'tenants', 'users', 'outlets', 'bahan', 'transactions', 
        'accounts', 'journals', 'journal_lines', 'suppliers', 
        'purchase_orders', 'grns'
    ];

    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`❌ Table [${table}]: MISSING or ERROR (${error.message})`);
        } else {
            console.log(`✅ Table [${table}]: ACTIVE (Count: ${count})`);
        }
    }
}

auditDatabase();
