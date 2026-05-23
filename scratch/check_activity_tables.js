const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  console.log("Checking activity logging tables...");
  
  const { data: activity_log, error: err1 } = await supabase.from('activity_log').select('*').limit(1);
  if (err1) {
    console.error("activity_log table error:", err1.message);
  } else {
    console.log("activity_log table exists and retrieved:", activity_log);
  }

  const { data: activity_logs, error: err2 } = await supabase.from('activity_logs').select('*').limit(1);
  if (err2) {
    console.error("activity_logs table error:", err2.message);
  } else {
    console.log("activity_logs table exists and retrieved:", activity_logs);
  }
}

check();
