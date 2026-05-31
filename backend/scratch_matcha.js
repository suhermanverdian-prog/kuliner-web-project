const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkMatcha() {
  try {
    console.log('--- 🔍 DIAGNOSTIC: Kyoto Iced Matcha ---');
    
    // 1. Get the menu item
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu')
      .select('*')
      .ilike('name', '%Kyoto Iced Matcha%');
      
    if (menuErr) throw menuErr;
    if (!menuItems || menuItems.length === 0) {
      console.log('❌ Menu "Kyoto Iced Matcha" tidak ditemukan.');
      return;
    }
    
    const matchaMenu = menuItems[0];
    console.log(`Menu: ${matchaMenu.name}`);
    console.log(`ID: ${matchaMenu.id}`);
    console.log(`Harga Jual: Rp ${matchaMenu.price}`);
    console.log(`HPP Tertera di Card: Rp ${matchaMenu.hpp}`);

    // 2. Get BOM
    const { data: boms, error: bomErr } = await supabase
      .from('menu_bom')
      .select('*')
      .eq('menu_id', matchaMenu.id);
      
    if (bomErr) throw bomErr;
    console.log(`\nBOM (Resep) count: ${boms.length}`);
    
    for (const bom of boms) {
      // Get bahan info
      const { data: bahan, error: bErr } = await supabase
        .from('bahan')
        .select('*')
        .eq('id', bom.bahan_id)
        .single();
        
      if (bErr) {
        console.log(`❌ Gagal mengambil bahan ID ${bom.bahan_id}: ${bErr.message}`);
        continue;
      }
      
      console.log(`\nBahan: ${bahan.name}`);
      console.log(`  - Qty Needed di Resep: ${bom.qty_needed}`);
      console.log(`  - Satuan Dasar di DB: ${bahan.unit}`);
      console.log(`  - Cost di DB (per satuan dasar): Rp ${bahan.cost}`);
      console.log(`  - Stock saat ini: ${bahan.stock}`);
      
      // Calculate HPP contribution
      // Let's see how our code did it in transactionService:
      // const baseUsedQty = usedQty / conv.ratio;
      // Wait, let's see unit conversions!
      const { data: convs } = await supabase
        .from('unit_conversions')
        .select('*')
        .eq('bahan_id', bahan.id);
        
      console.log(`  - Konversi Satuan yang tersedia:`, convs);
    }
    
  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

checkMatcha();
