const { supabase } = require('./backend/src/supabase');

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_policies'); // This might not work if RPC is not defined
    
    // Alternative: Try to select from a table that usually has RLS
    const { data: users, error: uErr } = await supabase.from('users').select('count', { count: 'exact' });
    console.log('Users count:', users, 'Error:', uErr);
}

checkRLS();
