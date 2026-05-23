const { supabase } = require('../backend/src/supabase');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function testLoginSimulate() {
    console.log('🔍 MENDIAGNOSA KONEKSI LOGIN KE DATABASE\n');
    
    const loginIdentifier = 'messi';
    const passwordInput = 'goal10';

    console.log(`📡 [Langkah 1] Mencoba query pencarian user '${loginIdentifier}'...`);
    
    // Simulasikan query select yang bermasalah
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .or(`email.eq.${loginIdentifier},username.eq.${loginIdentifier}`)
      .single();

    if (userError) {
        console.error('❌ Gagal melakukan query database!');
        console.error('   Kode Error : ', userError.code);
        console.error('   Pesan Error: ', userError.message);
        console.error('   Detail     : ', userError.details);
        
        console.log('\n💡 [Analisis Kabel]: Jika pesan error menyebutkan "relation does not exist" atau "could not find relation", artinya foreign key dari users.tenant_id ke tenants.id terputus di database.');
        
        // Coba kueri tanpa relasi tenants untuk melihat apakah data usernya ada
        console.log('\n📡 Mencoba alternatif query tanpa join relasi tenants...');
        const { data: rawUser, error: rawError } = await supabase
            .from('users')
            .select('*')
            .eq('username', loginIdentifier)
            .single();
            
        if (rawError) {
            console.error('❌ Kueri dasar pun gagal:', rawError.message);
        } else {
            console.log('✅ Kueri dasar SUKSES! Data user ditemukan tanpa join.');
            console.log(`   Username di DB: ${rawUser.username}`);
            console.log(`   Role          : ${rawUser.role}`);
            console.log(`   Password Hash : ${rawUser.password}`);
            
            // Tes verifikasi password
            const isMatch = bcrypt.compareSync(passwordInput, rawUser.password);
            console.log(`   Kesesuaian Password '${passwordInput}': ${isMatch ? '✅ COCOK' : '❌ TIDAK COCOK'}`);
        }
    } else {
        console.log('✅ Kueri database SUKSES! Relasi join berhasil dibaca.');
        console.log(`   User Ditemukan: ${user.name} (${user.username})`);
        console.log(`   Tenant Name   : ${user.tenant?.name || 'N/A'}`);
        
        // Verifikasi password
        const isMatch = bcrypt.compareSync(passwordInput, user.password);
        console.log(`   Kesesuaian Password: ${isMatch ? '✅ COCOK' : '❌ TIDAK COCOK'}`);
    }
}

testLoginSimulate();
