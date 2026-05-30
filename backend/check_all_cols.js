require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const tablesToCheck = [
  'transactions', 'transaction_items', 'bahan', 'menu', 'menu_bom', 'audit_logs'
];

async function checkCols() {
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: table });
    if (!error && data) {
        console.log(`\n=== Table: ${table} ===`);
        console.log(data);
    } else {
        // If RPC doesn't exist, we just select 1 to get column keys
        const { data: rows } = await supabase.from(table).select('*').limit(1);
        if (rows && rows.length > 0) {
           console.log(`\n=== Table: ${table} ===`);
           console.log("Columns:", Object.keys(rows[0]));
        } else {
           // Insert a fake row and rollback? Hard in REST API without transaction.
           console.log(`\n=== Table: ${table} === (RPC failed, table empty)`);
        }
    }
  }
}

checkCols();
