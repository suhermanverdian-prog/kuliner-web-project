const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Attempting to insert dummy item...');
  const { data, error } = await supabase.from('transaction_items').insert([{
    transaction_id: 'TRX-0002',
    menu_id: 201, // Espresso id from data.json
    qty: 1,
    price: 25000
  }]).select();
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert success:', data);
  }
}

testInsert();
