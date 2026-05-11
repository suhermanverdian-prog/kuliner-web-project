const { supabase } = require('./backend/src/supabase');

async function simulateLogin(username, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*, tenant:tenants(*)')
        .eq('username', username)
        .eq('password', password)
        .single();
    
    if (error) {
        console.log('Login Error:', error.message);
    } else {
        console.log('Login Success:', data);
    }
}

console.log('--- Simulating superadmin login ---');
simulateLogin('superadmin', 'admin123');
