require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabase } = require('../src/supabase');

async function migrateTrxItems() {
  const { data, error } = await supabase.from('transactions').select('id, items');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  let migrated = 0;
  for (const trx of data) {
    if (Array.isArray(trx.items)) {
      const newMeta = {
        kds_status: 'new',
        table_type: 'Take Away',
        cashier_name: 'Migrated',
        items: trx.items
      };
      await supabase.from('transactions').update({ items: newMeta }).eq('id', trx.id);
      migrated++;
    }
  }
  console.log(`Migrated ${migrated} legacy transactions.`);
}

migrateTrxItems();
