const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy_key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('WARNING: SUPABASE_URL and SUPABASE_KEY not defined in environment. Using dummy values.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
