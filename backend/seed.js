const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'src', 'db', 'data.json');

// Real images from unsplash (coffee related)
const IMG_ESPRESSO = 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80';
const IMG_LATTE = 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=400&q=80';
const IMG_AMERICANO = 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=400&q=80';

const seedData = {
  users: [
    { id: 1, name: 'Ahmad Fauzi', username: 'admin', password: 'admin123', role: 'admin', avatar: 'AF' },
    { id: 2, name: 'Siti Rahayu', username: 'owner', password: 'owner123', role: 'owner', avatar: 'SR' },
    { id: 3, name: 'Budi Santoso', username: 'kasir', password: 'kasir123', role: 'kasir', avatar: 'BS' },
    { id: 4, name: 'Dewi Lestari', username: 'koki', password: 'koki123', role: 'koki', avatar: 'DL' },
    { id: 5, name: 'Rizky Pratama', username: 'gudang', password: 'gudang123', role: 'gudang', avatar: 'RP' },
  ],
  bahan: [
    { id: 101, name: 'Biji Kopi Arabica', category: 'Biji Kopi', stock: 5000, unit: 'Gram', minStock: 1000, price: 200 }, // Rp 200 / gram (Rp 200.000 / kg)
    { id: 102, name: 'Susu Segar', category: 'Susu', stock: 5000, unit: 'ml', minStock: 2000, price: 20 }, // Rp 20 / ml (Rp 20.000 / liter)
    { id: 103, name: 'Gula Aren', category: 'Sirup & Perasa', stock: 2000, unit: 'Gram', minStock: 500, price: 50 },
    { id: 104, name: 'Cup Plastik', category: 'Packaging', stock: 500, unit: 'Pcs', minStock: 100, price: 1000 },
    { id: 105, name: 'Air Mineral', category: 'Lainnya', stock: 10000, unit: 'ml', minStock: 5000, price: 5 },
  ],
  menu: [
    {
      id: 201, name: 'Espresso', category: 'Kopi', price: 25000, cost: 4600, icon: '☕', image: IMG_ESPRESSO, unit: 'Cup', stock: 99,
      bom: [
        { bahanId: 101, qty: 18 }, // 18g Kopi
        { bahanId: 104, qty: 1 }   // 1 Cup
      ]
    },
    {
      id: 202, name: 'Cafe Latte', category: 'Kopi', price: 35000, cost: 7600, icon: '☕', image: IMG_LATTE, unit: 'Cup', stock: 99,
      bom: [
        { bahanId: 101, qty: 18 }, // 18g Kopi
        { bahanId: 102, qty: 150 },// 150ml Susu
        { bahanId: 104, qty: 1 }   // 1 Cup
      ]
    },
    {
      id: 203, name: 'Kopi Susu Aren', category: 'Kopi', price: 28000, cost: 6600, icon: '☕', image: null, unit: 'Cup', stock: 99,
      bom: [
        { bahanId: 101, qty: 15 }, // 15g Kopi
        { bahanId: 102, qty: 100 },// 100ml Susu
        { bahanId: 103, qty: 30 }, // 30g Gula Aren
        { bahanId: 104, qty: 1 }   // 1 Cup
      ]
    },
    {
      id: 204, name: 'Americano', category: 'Kopi', price: 28000, cost: 5100, icon: '☕', image: IMG_AMERICANO, unit: 'Cup', stock: 99,
      bom: [
        { bahanId: 101, qty: 18 }, // 18g Kopi
        { bahanId: 105, qty: 100 },// 100ml Air
        { bahanId: 104, qty: 1 }   // 1 Cup
      ]
    }
  ],
  transactions: [],
  orders: [],
  customers: [],
  tables: [],
  shifts: [],
  settings: { storeName: 'BrewMaster Coffee', tax: 10, serviceCharge: 5, rewardEnabled: true }
};

fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2));
console.log('✅ Database berhasil diisi (seeded) dengan data BOM dan foto produk!');
