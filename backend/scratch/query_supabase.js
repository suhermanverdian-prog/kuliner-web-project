const { supabase } = require('../src/supabase');

async function run() {
  try {
    console.log('📡 Querying Supabase Cloud...');
    
    // 1. Check GRNs count
    const { data: grns, error: grnErr } = await supabase.from('grns').select('*');
    if (grnErr) throw grnErr;
    console.log(`📊 Total rows in 'grns': ${grns.length}`);
    if (grns.length > 0) {
      console.log('Sample GRN:', JSON.stringify(grns[0], null, 2));
    }

    // 2. Check GRN Items count
    const { data: grnItems, error: itemErr } = await supabase.from('grn_items').select('*');
    if (itemErr) throw itemErr;
    console.log(`📊 Total rows in 'grn_items': ${grnItems.length}`);
    if (grnItems.length > 0) {
      console.log('Sample GRN Item:', JSON.stringify(grnItems[0], null, 2));
    } else {
      console.log('⚠️ table grn_items is completely empty in Supabase!');
    }

    // 3. Check table schema or columns by fetching single rows
    const { data: grnCols } = await supabase.from('grns').select('*').limit(1);
    console.log('GRN columns:', grnCols && grnCols[0] ? Object.keys(grnCols[0]) : 'no data');

    const { data: itemCols } = await supabase.from('grn_items').select('*').limit(1);
    console.log('GRN Item columns:', itemCols && itemCols[0] ? Object.keys(itemCols[0]) : 'no data');

  } catch (err) {
    console.error('🚨 Error querying Supabase:', err.message);
  }
}

run();
