const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    const { error } = await supabase.from('bahan').insert([{ name: 'Test', supplier_id: '00000000-0000-0000-0000-000000000000' }]);
    console.log('Error if exists:', error?.message);
}

test();
