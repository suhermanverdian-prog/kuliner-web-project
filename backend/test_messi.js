const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL', 
  process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY'
);

async function testExactLogin() {
  const loginIdentifier = 'messi';
  const { data, error } = await supabase
    .from('users')
    .select('*, tenant:tenants(*)')
    .or(`email.eq.${loginIdentifier},username.eq.${loginIdentifier}`)
    .single();
    
  if (error) {
    console.error('Supabase query error:', error);
  } else {
    console.log('Query success:', data.username, data.password);
  }
}

testExactLogin();
