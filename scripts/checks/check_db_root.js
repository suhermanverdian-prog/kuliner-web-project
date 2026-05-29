const { supabase } = require('../../backend/src/supabase');

async function checkSettingsTables() {
    console.log('--- SETTINGS TABLES AUDIT ---');
    
    // Check 'settings' table
    const { data: sData, error: sErr } = await supabase.from('settings').select('*').limit(1);
    if (sErr) console.log('❌ settings table error:', sErr.message);
    else console.log('✅ settings table exists');

    // Check 'loyalty_settings' table
    const { data: lData, error: lErr } = await supabase.from('loyalty_settings').select('*').limit(1);
    if (lErr) console.log('❌ loyalty_settings table error:', lErr.message);
    else console.log('✅ loyalty_settings table exists');

    // Test a simple insert to see what fails
    console.log('\n--- TESTING UPSERT ---');
    const testPayload = { tenant_id: '52fbacf9-4028-4f03-9de5-5754e5842458', store_name: 'Audit Test' };
    const { error: upsertErr } = await supabase.from('settings').upsert([testPayload], { onConflict: 'tenant_id' });
    if (upsertErr) console.log('❌ Upsert failed:', upsertErr.message);
    else console.log('✅ Upsert success');
}

checkSettingsTables();
