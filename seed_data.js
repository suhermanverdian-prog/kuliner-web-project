const { supabase } = require('./backend/src/supabase');

async function seedData() {
    console.log('🚀 SEEDING INITIAL ENTERPRISE DATA...\n');

    // 1. Get the Main Tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) return console.log('❌ No tenant found. Run migration first.');
    const tenantId = tenants[0].id;

    // 2. Seed Default Outlet
    console.log('📍 Seeding Default Outlet...');
    const { data: existingOutlets } = await supabase.from('outlets').select('id').eq('name', 'Pusat (Main Branch)');
    if (!existingOutlets || existingOutlets.length === 0) {
        await supabase.from('outlets').insert([
            { tenant_id: tenantId, name: 'Pusat (Main Branch)', address: 'Jakarta', is_active: true }
        ]);
        console.log('✅ Default outlet created.');
    } else {
        console.log('ℹ️ Default outlet already exists.');
    }

    // 3. Seed Chart of Accounts (COA)
    console.log('📒 Seeding Chart of Accounts...');
    const defaultAccounts = [
        { tenant_id: tenantId, code: '1-1000', name: 'Kas & Bank', category: 'Asset', normal_balance: 'debit' },
        { tenant_id: tenantId, code: '1-2000', name: 'Piutang Usaha', category: 'Asset', normal_balance: 'debit' },
        { tenant_id: tenantId, code: '1-3000', name: 'Persediaan Barang', category: 'Asset', normal_balance: 'debit' },
        { tenant_id: tenantId, code: '2-1000', name: 'Hutang Usaha', category: 'Liability', normal_balance: 'credit' },
        { tenant_id: tenantId, code: '3-1000', name: 'Modal Pemilik', category: 'Equity', normal_balance: 'credit' },
        { tenant_id: tenantId, code: '4-1000', name: 'Pendapatan Penjualan', category: 'Revenue', normal_balance: 'credit' },
        { tenant_id: tenantId, code: '5-1000', name: 'Harga Pokok Penjualan (HPP)', category: 'Expense', normal_balance: 'debit' },
        { tenant_id: tenantId, code: '6-1000', name: 'Beban Gaji', category: 'Expense', normal_balance: 'debit' },
        { tenant_id: tenantId, code: '6-2000', name: 'Beban Operasional', category: 'Expense', normal_balance: 'debit' },
    ];

    for (const acc of defaultAccounts) {
        await supabase.from('accounts').upsert(acc, { onConflict: 'tenant_id, code' });
    }

    console.log('\n✨ Seeding Completed Successfully!');
}

seedData();
