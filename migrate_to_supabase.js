/**
 * KEN ERP - Data Migration Tool (v2.4 - Forced SuperAdmin)
 */

const fs = require('fs');
const path = require('path');
const { supabase } = require('./backend/src/supabase');

const DB_PATH = path.join(__dirname, 'backend', 'src', 'db', 'data.json');

async function migrate() {
    console.log('🚀 Starting migration v2.4 (Forcing SuperAdmin)...');

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

    // 2. Migrate Users + FORCE SUPERADMIN
    console.log('--- Migrating Users ---');
    const users = db.users || [];
    
    // Pastikan superadmin ada di daftar
    if (!users.find(u => u.username === 'superadmin')) {
        users.push({
            name: 'Super Admin',
            username: 'superadmin',
            password: 'admin123', // Password default
            role: 'admin',
            permissions: { all: true }
        });
    }

    const userList = users.map(u => ({
        tenant_id: tenantId,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role || 'admin',
        permissions: u.permissions || { all: true }
    }));

    const { error: uErr } = await supabase.from('users').upsert(userList, { onConflict: 'tenant_id,username' });
    if (uErr) console.error('Users Error:', uErr.message); else console.log(`✅ Migrated ${userList.length} users (including superadmin).`);

    console.log('\n✨ Migration Success! Password superadmin: admin123');
}

migrate();
