const { supabase } = require('../src/supabase');

async function checkSchema() {
  console.log('🔍 Querying Postgres information_schema for table: grns and grn_items...');
  
  // We can execute raw SQL if there is a general query RPC, or let's inspect what happens
  // when we select a non-existent row, Postgrest often returns column metadata or we can fetch a single row and see keys.
  // Wait, let's execute an RPC if available. If not, let's see if we can do a mock query or select.
  // Wait! We can check if we can insert a blank object {} into grns and see the error message (it often lists allowed columns!).
  
  console.log('Testing insert with empty object to grns...');
  const { error: err1 } = await supabase.from('grns').insert([{}]);
  if (err1) {
    console.log('Grns empty insert output:', err1.message, '\nDetails:', err1.details);
  }

  console.log('\nTesting insert with empty object to grn_items...');
  const { error: err2 } = await supabase.from('grn_items').insert([{}]);
  if (err2) {
    console.log('Grn_items empty insert output:', err2.message, '\nDetails:', err2.details);
  }
}

checkSchema().catch(console.error);
