const { supabase } = require('../backend/src/supabase');

async function syncAiSettings() {
    console.log('🔄 SINKRONISASI AI KEY DATABASE SUPABASE\n');
    
    // 1. Tarik semua baris dari tabel settings
    const { data: settingsList, error: fetchError } = await supabase
        .from('settings')
        .select('*');
        
    if (fetchError) {
        console.error('❌ Gagal mengambil data settings:', fetchError.message);
        return;
    }
    
    console.log(`ℹ️ Ditemukan ${settingsList.length} baris konfigurasi settings.\n`);
    
    const newKey = 'AIzaSyBo7HGLgbWhqaU-A-YHOfB_sbhaorqqHcM';
    
    for (const row of settingsList) {
        console.log(`⚙️ Memproses Tenant: ${row.tenant_id} (Store: ${row.store_name || 'N/A'})`);
        console.log(`   - Kunci Lama: ${row.ai_api_key ? row.ai_api_key.substring(0, 10) + '...' : 'Kosong'}`);
        console.log(`   - Provider Lama: ${row.ai_provider || 'Kosong'}`);
        
        // Update baris ke kunci Gemini baru
        const { data: updated, error: updateError } = await supabase
            .from('settings')
            .update({
                ai_api_key: newKey,
                ai_provider: 'gemini',
                is_ai_enabled: true
            })
            .eq('id', row.id)
            .select();
            
        if (updateError) {
            console.error(`   ❌ Gagal memperbarui tenant ${row.tenant_id}:`, updateError.message);
        } else {
            console.log(`   ✅ Sukses diperbarui ke Gemini (Kunci Baru: ${newKey.substring(0, 10)}...)`);
        }
    }
    
    console.log('\n✨ Selesai melakukan sinkronisasi database AI settings!');
}

syncAiSettings();
