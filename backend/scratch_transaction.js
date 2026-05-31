const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTransaction() {
  try {
    console.log('--- 🔍 DIAGNOSTIC: Transaction TRX-247392-83LY ---');
    
    // Get transaction header
    const { data: trx, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_number', 'TRX-247392-83LY')
      .single();
      
    if (txErr) throw txErr;
    console.log(`Transaction ID: ${trx.id}`);
    console.log(`Total HPP in Transactions Table: Rp ${trx.total_hpp}`);
    console.log(`Total Sales: Rp ${trx.total}`);
    
    // Get transaction items
    const { data: items, error: itemsErr } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', trx.id);
      
    if (itemsErr) throw itemsErr;
    console.log(`Items count: ${items.length}`);
    for (const item of items) {
      // Get menu name
      const { data: m } = await supabase.from('menu').select('name').eq('id', item.menu_id).single();
      console.log(` - Item: ${m?.name} | Qty: ${item.qty} | Subtotal HPP: ${item.subtotal_hpp}`);
    }

    // Let's get the journal entry too
    const { data: j } = await supabase
      .from('journals')
      .select('*')
      .eq('reference', 'TRX-247392-83LY')
      .maybeSingle();
      
    if (j) {
      console.log(`\nJournal Header: ${j.id}`);
      const { data: jl } = await supabase
        .from('journal_lines')
        .select('*')
        .eq('journal_id', j.id);
      console.log(`Journal Lines:`);
      jl.forEach(l => {
        console.log(` - [${l.account_code}] ${l.account_name} | Debit: ${l.debit} | Credit: ${l.credit}`);
      });
    }

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

checkTransaction();
