const { supabase } = require('../backend/src/supabase');

async function checkDatabaseUsers() {
    console.log('🔍 AUDIT DOCK KABEL DATABASE - DATA USER\n');
    
    // 1. Ambil semua data user dari tabel users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, username, role, tenant_id');
        
    if (error) {
        console.error('❌ Gagal membaca tabel users:', error.message);
        return;
    }
    
    console.log(`ℹ️ Jumlah User terdaftar di Database: ${users.length} user.\n`);
    
    if (users.length === 0) {
        console.warn('⚠️ PERINGATAN: Tabel users kosong total! Tidak ada akun untuk login.');
    } else {
        users.forEach((u, i) => {
            console.log(`👤 User #${i+1}:`);
            console.log(`   - Nama    : ${u.name}`);
            console.log(`   - Username: ${u.username}`);
            console.log(`   - Role    : ${u.role}`);
            console.log(`   - Tenant  : ${u.tenant_id}`);
        });
    }
}

checkDatabaseUsers();
