const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkInventoryLogs() {
  try {
    console.log('--- 🔍 DIAGNOSTIC: Inventory Logs for TRX-247392-83LY ---');
    
    const { data: logs, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('reference_id', 'TRX-247392-83LY');
      
    if (error) throw error;
    console.log(`Logs count: ${logs.length}`);
    logs.forEach(l => {
      console.log(`- Bahan: ${l.bahan_name} | Qty Change: ${l.change_qty} | Prev Stock: ${l.prev_stock} | Next Stock: ${l.next_stock}`);
    });
  } catch (e) {
    console.error(e);
  }
}
checkInventoryLogs();
