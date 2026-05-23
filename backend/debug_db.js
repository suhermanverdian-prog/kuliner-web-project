const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debug() {
    const { data, error } = await supabase.from('bahan').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Columns in bahan:', Object.keys(data[0] || {}));
}

debug();
