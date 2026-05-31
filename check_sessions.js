const { supabase } = require('./backend/src/supabase');

async function check() {
  try {
    const { data: outlets, error } = await supabase.from('outlets').select('*');
    if (error) throw error;
    console.log('--- OUTLETS ---');
    console.log(outlets);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
