const { supabase } = require('./backend/src/supabase');

async function checkUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, username, password, role');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Users in Supabase:', data);
    }
}

checkUsers();
