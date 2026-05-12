const { supabase } = require('../backend/src/supabase');

async function addNewMenuFinal() {
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

    // 3. Add BOM using legacy integer IDs
    console.log('Adding BOM with legacy IDs...');
    const boms = [
        { menu_id: menuId, bahan_id: 117, qty: 30 }, // Bubuk Matcha
        { menu_id: menuId, bahan_id: 118, qty: 50 }, // Whipped Cream
        { menu_id: menuId, bahan_id: 102, qty: 150 }, // Susu Segar
        { menu_id: menuId, bahan_id: 104, qty: 1 }   // Cup Plastik
    ];
    
    const { error: bomErr } = await supabase.from('menu_bom').insert(boms);
    if (bomErr) console.error('BOM Error:', bomErr);
    
    console.log('Success: New menu added with legacy-mapped BOM.');
}

addNewMenuFinal();
