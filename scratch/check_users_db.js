const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
  console.log("Supabase URL:", process.env.SUPABASE_URL);
  
  // 1. Check all users
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  if (uErr) {
    console.error("Error reading users:", uErr.message);
  } else {
    console.log(`\n=== USERS IN DATABASE (${users.length}) ===`);
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email/User: ${u.email || u.username} | Name: ${u.name} | Role: ${u.role} | Tenant ID: ${u.tenant_id}`);
    });
  }

  // 2. Check role permissions
  const { data: perms, error: pErr } = await supabase.from('role_permissions').select('*');
  if (pErr) {
    console.error("Error reading role_permissions:", pErr.message);
  } else {
    console.log(`\n=== ROLE PERMISSIONS IN DATABASE (${perms.length}) ===`);
    perms.forEach(p => {
      console.log(`Role: ${p.role} | Feature: ${p.feature_key} | View: ${p.can_view} | Create: ${p.can_create} | Tenant: ${p.tenant_id}`);
    });
  }
}

check();
