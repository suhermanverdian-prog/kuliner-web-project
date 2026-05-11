/**
 * KEN ERP - Data Migration Tool (v2.3 - Final Migration & Users)
 */

const fs = require('fs');
const path = require('path');
const { supabase } = require('./backend/src/supabase');

const DB_PATH = path.join(__dirname, 'backend', 'src', 'db', 'data.json');

async function migrate() {
    console.log('🚀 Starting full migration (v2.3)...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ data.json not found!');
        return;
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    
    // 1. Create/Get Tenant
    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .upsert([{ name: 'Main Store', tier: 'enterprise' }], { onConflict: 'name' })
        .select()
        .single();
    
    if (tErr) { console.error('Tenant Error:', tErr.message); return; }
    const tenantId = tenant.id;
    console.log('✅ Tenant Ready (Enterprise):', tenantId);

    // 2. Migrate Users (KUNCI LOGIN)
    console.log('--- Migrating Users ---');
    const userList = (db.users || []).map(u => ({
        tenant_id: tenantId,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role || 'admin',
        permissions: u.permissions || { all: true }
    }));
    if (userList.length > 0) {
        const { error } = await supabase.from('users').upsert(userList, { onConflict: 'tenant_id,username' });
        if (error) console.error('Users Error:', error.message); else console.log(`✅ Migrated ${userList.length} users. Anda sekarang bisa login!`);
    }

    // 3. Migrate Accounts
    console.log('--- Migrating Accounts ---');
    const uniqueAccounts = {};
    (db.accounts || []).forEach(a => { uniqueAccounts[a.code] = a; });
    const accountList = Object.values(uniqueAccounts).map(a => ({
        tenant_id: tenantId,
        code: String(a.code),
        name: a.name,
        category: a.category,
        normal_balance: a.normalBalance || 'debit'
    }));
    if (accountList.length > 0) {
        const { error } = await supabase.from('accounts').upsert(accountList, { onConflict: 'tenant_id,code' });
        if (error) console.log('Accounts Error:', error.message); else console.log(`✅ Migrated ${accountList.length} accounts`);
    }

    // 4. Migrate Inventory
    console.log('--- Migrating Inventory ---');
    const uniqueBahan = {};
    (db.bahan || []).forEach(b => { if (b.name) uniqueBahan[b.name.trim().toLowerCase()] = b; });
    const bahanList = Object.values(uniqueBahan).map(b => ({
        tenant_id: tenantId,
        name: b.name,
        category: b.category,
        unit: b.unit,
        stock: Number(b.stock || 0),
        cost: Number(b.cost || 0)
    }));
    if (bahanList.length > 0) {
        const { error } = await supabase.from('bahan').upsert(bahanList, { onConflict: 'tenant_id,name' });
        if (error) console.log('Bahan Error:', error.message); else console.log(`✅ Migrated ${bahanList.length} items`);
    }

    console.log('\n✨ Migration v2.3 Success! Silakan login sekarang.');
}

migrate();
