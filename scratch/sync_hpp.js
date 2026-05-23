const { supabase } = require('./backend/src/supabase');
const mapping = { 
  '101': 'Biji Kopi Arabica', 
  '102': 'Susu Segar', 
  '103': 'Gula Aren', 
  '104': 'Cup Plastik', 
  '105': 'Air Mineral', 
  '117': 'Bubuk Matcha Premium', 
  '118': 'Whipped Cream', 
  '119': 'Sirup Vanilla', 
  '120': 'Adonan Croissant', 
  '121': 'Kentang Frozen', 
  '122': 'Roti Gandum', 
  '123': 'Bubuk Red Velvet', 
  '124': 'Oat Milk', 
  '125': 'Sirup Caramel' 
};

async function run() {
  console.log('Starting HPP Sync...');
  const { data: menus, error: mErr } = await supabase.from('menu').select('*, bom:menu_bom(*)');
  const { data: bahan, error: bErr } = await supabase.from('bahan').select('*');
  
  if (mErr || bErr) {
    console.error('Error fetching data:', mErr || bErr);
    return;
  }

  for (const m of menus) {
    let totalCost = 0;
    const bomRows = m.bom || [];
    
    for (const row of bomRows) {
      const bName = mapping[row.bahan_id];
      const b = bahan.find(x => x.name === bName);
      if (b) {
        let ratio = 1;
        const u = (b.unit || '').toLowerCase();
        if (u === 'kg' || u === 'kilogram' || u === 'liter' || u === 'l') {
          ratio = 1000;
        }
        const unitCost = (b.cost || b.price || 0) / ratio;
        totalCost += unitCost * (row.qty_needed || row.qty || 0);
      }
    }
    
    console.log(`Updating ${m.name}: Cost ${totalCost}`);
    await supabase.from('menu').update({ cost: Math.round(totalCost) }).eq('id', m.id);
  }
  console.log('HPP Sync Finished.');
}

run();
