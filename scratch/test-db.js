const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase
      .from('customisations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying customisations:', error);
    } else {
      console.log('✅ Customisations query success, rows found:', data.length);
      console.log(data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

test();
