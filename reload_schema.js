require('dotenv').config();
const { supabase } = require('./backend/src/supabase');

async function reload() {
  console.log('Reloading Supabase schema cache...');
  const { error } = await supabase.rpc('exec_sql', {
    sql: `NOTIFY pgrst, 'reload schema'`
  });
  if (error) {
    console.error('Error reloading schema:', error);
  } else {
    console.log('Schema cache reloaded successfully!');
  }
}

reload();
