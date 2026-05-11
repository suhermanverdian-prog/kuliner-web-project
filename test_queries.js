const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testQueries() {
  console.log("--- Testing laporan/summary query ---");
  const tenantId = null; // simulate undefined header
  
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  
  let query = supabase
      .from('transactions')
      .select('*')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .eq('payment_status', 'paid');
      
  if (tenantId) query = query.eq('tenant_id', tenantId);
  
  const { data: trx, error: err1 } = await query;
  if (err1) console.error("Error trx:", err1.message);
  else console.log("Trx count:", trx.length);

  console.log("\n--- Testing analytics/inventory query ---");
  const { data: movements, error: err2 } = await supabase
      .from('inventory_logs')
      .select('*')
      .limit(1);
  if (err2) console.error("Error inventory_logs:", err2.message);
  else console.log("Inventory logs OK");
  
  const { data: movements2, error: err3 } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(1);
  if (err3) console.error("Error stock_movements:", err3.message);
  else console.log("Stock movements OK");
}
testQueries();
