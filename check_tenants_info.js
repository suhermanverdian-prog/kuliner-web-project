const { supabase } = require('./backend/src/supabase');

async function checkTenants() {
  console.log("=== 🔍 TENANTS DIAGNOSTIC ===");
  const { data: tenants, error } = await supabase.from('tenants').select('*');
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    tenants.forEach(t => {
      console.log(`Tenant ID: ${t.id} | Name: ${t.name} | Tier: ${t.tier} | Overrides:`, t.feature_overrides);
    });
  }
}

checkTenants();
