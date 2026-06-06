require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('tenants').select('*').eq('id', '00000000-0000-0000-0000-000000000000').maybeSingle();
  if (error) {
    console.error(error);
  } else {
    console.log("Superadmin tenant in DB:", data);
  }
}
check();
