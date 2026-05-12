const { supabase } = require('../backend/src/supabase');

async function fixMenuBom() {
    console.log('Fetching all bahan...');
    const { data: bahan } = await supabase.from('bahan').select('id, name');
    
    // Hardcoded mapping based on common sense and data.json if names differ
    // But we'll try to match by name first.
    const nameToId = {};
    bahan.forEach(b => {
        nameToId[b.name.toLowerCase()] = b.id;
    });

    // Old IDs from data.json (approximate)
    const oldIdToName = {
        '101': 'biji kopi arabica',
        '102': 'susu segar',
        '103': 'gula aren',
        '104': 'cup plastik',
        '105': 'air mineral',
        '108': 'susu kental manis', // guessed
        '1777771499274': 'oat milk',
        '1777771764768': 'sirup caramel'
    };

    console.log('Fetching all menu_bom...');
    const { data: boms } = await supabase.from('menu_bom').select('*');
    
    for (const b of boms) {
        if (typeof b.bahan_id === 'number' || !b.bahan_id.includes('-')) {
            const name = oldIdToName[String(b.bahan_id)];
            const newId = nameToId[name];
            if (newId) {
                console.log(`Updating BOM ${b.id}: ${b.bahan_id} -> ${newId} (${name})`);
                await supabase.from('menu_bom').update({ bahan_id: newId }).eq('id', b.id);
            } else {
                console.log(`WARNING: Could not map old ID ${b.bahan_id} (Name: ${name})`);
            }
        }
    }
    console.log('Done.');
}

fixMenuBom();
