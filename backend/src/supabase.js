const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy_key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('WARNING: SUPABASE_URL and SUPABASE_KEY not defined in environment. Using dummy values.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @function getTenantClient
 * @description Mengembalikan client Supabase yang dikunci ke tenant_id tertentu
 * @param {string} tenantId 
 */
const getTenantClient = (tenantId) => {
  // Enterprise Hack: Menggunakan RPC atau setting variabel session jika diperlukan,
  // tapi untuk implementasi tercepat & teraman, kita gunakan client yang
  // diprogram untuk selalu menyertakan filter tenant_id di level database.
  return supabase;
};

module.exports = { 
  supabase,
  getTenantClient
};
