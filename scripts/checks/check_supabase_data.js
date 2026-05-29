const { supabase } = require('../../backend/src/supabase');

async function debugData() {
    console.log('--- Checking Tenants ---');
    const { data: tenants } = await supabase.from('tenants').select('id, name');
    tenants.forEach(t => console.log(`ID: ${t.id} | Name: ${t.name}`));

    console.log('\n--- Checking Users ---');
    const { data: users } = await supabase.from('users').select('username, tenant_id');
    users.forEach(u => console.log(`User: ${u.username} | TenantID: ${u.tenant_id}`));
}

debugData();
