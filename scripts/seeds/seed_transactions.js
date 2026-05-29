
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedTransactions() {
  console.log("🚀 Seeding Transactions & Analytics Data...");

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants[0].id;
  
  const { data: outlets } = await supabase.from('outlets').select('id').limit(1);
  const outletId = outlets[0].id;

  const demoItems = [
    { name: 'Kopi Susu Gula Aren', qty: 2, price: 25000 },
    { name: 'Espresso', qty: 1, price: 20000 },
    { name: 'Croissant Cheese', qty: 1, price: 30000 }
  ];

  const transactions = [];
  const now = new Date();
  
  // Generate 20 transactions for the last 7 days
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 7));
    date.setHours(Math.floor(Math.random() * 12) + 8); // Business hours 8-20
    
    const total = demoItems.reduce((s, it) => s + (it.price * it.qty), 0);
    
    transactions.push({
      tenant_id: tenantId,
      outlet_id: outletId,
      order_number: `ORD-${Date.now()}-${i}`,
      customer_name: 'Customer Demo',
      total: total,
      payment_method: 'Cash',
      payment_status: 'paid',
      created_at: date.toISOString(),
      items: demoItems
    });
  }

  const { error } = await supabase.from('transactions').insert(transactions);
  
  if (error) console.error("❌ Seeding failed:", error.message);
  else console.log("✅ 20 Demo Transactions seeded successfully!");
}

seedTransactions();
