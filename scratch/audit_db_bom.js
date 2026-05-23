const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: 'c:/Users/HENI/Downloads/Pelatihan/apk/Coffeeshop/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function auditBOM() {
  try {
    console.log('--- 🔍 AUDIT BOM: Amber Roasted Latte ---');
    
    // 1. Cari Menu
    const { data: menu, error: menuErr } = await supabase
      .from('menu')
      .select('id, name')
      .ilike('name', '%Amber Roasted Latte%')
      .single();
    
    if (menuErr || !menu) {
      console.log('❌ Menu tidak ditemukan');
      return;
    }
    console.log(`✅ Menu Found: ${menu.name} (ID: ${menu.id})`);

    // 2. Cari BOM
    const { data: bom, error: bomErr } = await supabase
      .from('menu_bom')
      .select('*')
      .eq('menu_id', menu.id);
    
    if (bomErr) {
      console.log('❌ Error fetching BOM:', bomErr.message);
      return;
    }
    
    console.log(`📊 BOM Count: ${bom.length} items`);
    
    for (const item of bom) {
      const { data: bahan } = await supabase
        .from('bahan')
        .select('name, unit')
        .eq('id', item.bahan_id)
        .single();
      
      console.log(` - ${bahan?.name || 'UNKNOWN'} (${item.bahan_id}): ${item.qty_needed} ${bahan?.unit || ''}`);
    }

    // 3. Cek Bahan Baku secara umum
    const { data: allBahan } = await supabase.from('bahan').select('id, name').limit(5);
    console.log('\n📦 Contoh Bahan di DB:');
    allBahan.forEach(b => console.log(` - ${b.name} (${b.id})`));

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

auditBOM();
