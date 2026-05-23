const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixBOM() {
    console.log('🛠️ REPAIRING BOM TABLE (MIGRATING LEGACY IDs)...');

    // 1. Ambil semua bahan untuk mapping
    const { data: bahan } = await supabase.from('bahan').select('id, name');
    const mapping = {};
    
    // Hardcoded mapping based on previous sessions/context
    const legacyNames = {
        '101': 'Biji Kopi Arabica',
        '102': 'Susu Segar',
        '103': 'Gula Aren',
        '104': 'Cup Plastik',
        '105': 'Air Mineral'
    };

    bahan.forEach(b => {
        Object.keys(legacyNames).forEach(id => {
            if (legacyNames[id] === b.name) mapping[id] = b.id;
        });
    });

    console.log('Mapping Generated:', mapping);

    // 2. Ambil semua menu_bom
    const { data: boms } = await supabase.from('menu_bom').select('*');

    for (const bom of boms) {
        const newBahanId = mapping[bom.bahan_id];
        if (newBahanId) {
            console.log(`Updating BOM ID ${bom.id}: ${bom.bahan_id} -> ${newBahanId}`);
            await supabase.from('menu_bom').update({ bahan_id: newBahanId }).eq('id', bom.id);
        } else {
            console.warn(`⚠️ No mapping for legacy bahan_id: ${bom.bahan_id}`);
        }
    }

    console.log('✅ BOM REPAIR COMPLETED.');
}

fixBOM();
