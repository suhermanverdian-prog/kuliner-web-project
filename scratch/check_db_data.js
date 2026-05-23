const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4Njc5MzgsImV4cCI6MjA5MzQ0MzkzOH0.Qm7LLbG_UcyCkCbMlLU0MrtrHYcSEAPZ55ehJ6eTS2A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const tables = ['suppliers', 'purchase_orders', 'purchase_invoices', 'grns', 'users'];
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
    if (error) {
      console.log(`❌ Table ${table}: Error - ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: ${count} rows`);
    }
  }
}

checkData();
