const { supabase } = require('../backend/src/supabase');
const fs = require('fs');
const path = require('path');

async function addNewMenuAndBahan() {
    const tenantId = '52fbacf9-4028-4f03-9de5-5754e5842458';
    
    // 1. Add New Ingredients
    console.log('Adding new ingredients...');
    const newIngredients = [
        { name: 'Bubuk Matcha Premium', category: 'Powder', unit: 'Gram', stock: 5000, cost: 200, tenant_id: tenantId },
        { name: 'Whipped Cream', category: 'Dairy', unit: 'ml', stock: 2000, cost: 50, tenant_id: tenantId },
        { name: 'Sirup Vanilla', category: 'Sirup & Perasa', unit: 'ml', stock: 1000, cost: 100, tenant_id: tenantId }
    ];
    
    const { data: bahanData, error: bErr } = await supabase.from('bahan').insert(newIngredients).select();
    if (bErr) { console.error('Bahan Error:', bErr); return; }
    
    const idMap = {};
    bahanData.forEach(b => idMap[b.name] = b.id);

    // 2. Add New Menu
    console.log('Adding new menu...');
    // We'll use a local path for the image after copying it
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
        { menu_id: menuId, bahan_id: idMap['Susu Segar'] || '7405518d-a5a7-4123-9781-37f2f5cc248f', qty: 150 },
        { menu_id: menuId, bahan_id: idMap['Cup Plastik'] || 'cf040e3b-4193-41d0-be9e-abb755479a1b', qty: 1 }
    ];
    
    const { error: bomErr } = await supabase.from('menu_bom').insert(boms);
    if (bomErr) console.error('BOM Error:', bomErr);
    
    console.log('Success: New menu and ingredients added.');
}

addNewMenuAndBahan();
