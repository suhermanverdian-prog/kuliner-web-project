const { supabase } = require('../backend/src/supabase');

async function addNewMenuOnly() {
    const tenantId = '52fbacf9-4028-4f03-9de5-5754e5842458';
    
    // 1. Get Ingredients
    const { data: bahan } = await supabase.from('bahan').select('id, name');
    const idMap = {};
    bahan.forEach(b => idMap[b.name] = b.id);

    // 2. Add New Menu
    console.log('Adding new menu...');
    const imageName = 'matcha_frappe_premium_1778596302932.png';
    const publicUrl = `http://localhost:3001/uploads/${imageName}`;

    const newMenu = {
        name: 'Matcha Frappe (Premium)',
        category: 'Non-Coffee',
        price: 45000,
        cost: 15000,
        image: publicUrl,
        unit: 'Cup'
    };

    const { data: menuData, error: mErr } = await supabase.from('menu').insert([newMenu]).select();
    if (mErr) { console.error('Menu Error:', mErr); return; }
    const menuId = menuData[0].id;

    // 3. Add BOM
    console.log('Adding BOM...');
    const boms = [
        { menu_id: menuId, bahan_id: idMap['Bubuk Matcha Premium'], qty: 30 },
        { menu_id: menuId, bahan_id: idMap['Whipped Cream'], qty: 50 },
        { menu_id: menuId, bahan_id: idMap['Susu Segar'], qty: 150 },
        { menu_id: menuId, bahan_id: idMap['Cup Plastik'], qty: 1 }
    ];
    
    const { error: bomErr } = await supabase.from('menu_bom').insert(boms);
    if (bomErr) console.error('BOM Error:', bomErr);
    
    console.log('Success: New menu added.');
}

addNewMenuOnly();
