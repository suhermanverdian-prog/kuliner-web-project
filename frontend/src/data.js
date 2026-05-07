// Global app state & mock data
export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  KASIR: 'kasir',
  KOKI: 'koki',
  GUDANG: 'gudang',
  AKUNTAN: 'akuntan',
};

export const MOCK_USERS = [
  { id: 1, name: 'Ahmad Fauzi', username: 'admin', password: 'admin123', role: ROLES.ADMIN, avatar: 'AF' },
  { id: 2, name: 'Siti Rahayu', username: 'owner', password: 'owner123', role: ROLES.OWNER, avatar: 'SR' },
  { id: 3, name: 'Budi Santoso', username: 'kasir', password: 'kasir123', role: ROLES.KASIR, avatar: 'BS' },
  { id: 4, name: 'Dewi Lestari', username: 'koki', password: 'koki123', role: ROLES.KOKI, avatar: 'DL' },
  { id: 5, name: 'Rizky Pratama', username: 'gudang', password: 'gudang123', role: ROLES.GUDANG, avatar: 'RP' },
];

export const MENU_CATEGORIES = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Snack'];

export const MOCK_MENU = [
  { id: 1, name: 'Espresso', category: 'Kopi', price: 25000, cost: 8000, icon: '☕', stock: 50, unit: 'Cup' },
  { id: 2, name: 'Americano', category: 'Kopi', price: 28000, cost: 9000, icon: '☕', stock: 45, unit: 'Cup' },
  { id: 3, name: 'Latte', category: 'Kopi', price: 35000, cost: 12000, icon: '🥛', stock: 40, unit: 'Cup' },
  { id: 4, name: 'Cappuccino', category: 'Kopi', price: 35000, cost: 11500, icon: '☕', stock: 38, unit: 'Cup' },
  { id: 5, name: 'Caramel Macchiato', category: 'Kopi', price: 42000, cost: 15000, icon: '🍮', stock: 30, unit: 'Cup' },
  { id: 6, name: 'Cold Brew', category: 'Kopi', price: 38000, cost: 10000, icon: '🧊', stock: 25, unit: 'Cup' },
  { id: 7, name: 'Matcha Latte', category: 'Non-Kopi', price: 38000, cost: 14000, icon: '🍵', stock: 35, unit: 'Cup' },
  { id: 8, name: 'Teh Tarik', category: 'Non-Kopi', price: 20000, cost: 5000, icon: '🍵', stock: 50, unit: 'Cup' },
  { id: 9, name: 'Coklat Panas', category: 'Non-Kopi', price: 28000, cost: 9000, icon: '🍫', stock: 40, unit: 'Cup' },
  { id: 10, name: 'Croissant', category: 'Makanan', price: 22000, cost: 10000, icon: '🥐', stock: 20, unit: 'Pcs' },
  { id: 11, name: 'Nasi Goreng', category: 'Makanan', price: 35000, cost: 12000, icon: '🍳', stock: 30, unit: 'Porsi' },
  { id: 12, name: 'Sandwich', category: 'Makanan', price: 32000, cost: 13000, icon: '🥪', stock: 18, unit: 'Pcs' },
  { id: 13, name: 'Donat', category: 'Snack', price: 12000, cost: 4000, icon: '🍩', stock: 25, unit: 'Pcs' },
  { id: 14, name: 'Cookies', category: 'Snack', price: 15000, cost: 5000, icon: '🍪', stock: 30, unit: 'Pcs' },
];

export const MOCK_BAHAN = [
  { id: 1, name: 'Biji Kopi Arabika', unit: 'Gram', stock: 5000, minStock: 1000, price: 150, location: 'Gudang Utama' },
  { id: 2, name: 'Susu Full Cream', unit: 'ML', stock: 10000, minStock: 2000, price: 15, location: 'Dapur' },
  { id: 3, name: 'Gula Pasir', unit: 'Gram', stock: 8000, minStock: 1500, price: 12, location: 'Dapur' },
  { id: 4, name: 'Sirup Caramel', unit: 'ML', stock: 2000, minStock: 500, price: 50, location: 'Dapur' },
  { id: 5, name: 'Bubuk Matcha', unit: 'Gram', stock: 800, minStock: 300, price: 200, location: 'Gudang Utama' },
  { id: 6, name: 'Teh Celup', unit: 'Pcs', stock: 200, minStock: 50, price: 800, location: 'Gudang Utama' },
  { id: 7, name: 'Tepung Terigu', unit: 'Gram', stock: 10000, minStock: 2000, price: 8, location: 'Gudang Utama' },
  { id: 8, name: 'Beras', unit: 'Gram', stock: 20000, minStock: 5000, price: 14, location: 'Gudang Utama' },
];

export const MOCK_TRANSACTIONS = [
  { id: 'TRX-001', time: '09:15', table: 'Meja 3', kasir: 'Budi', total: 95000, items: 3, status: 'Selesai', type: 'Dine-in', payment: 'Tunai' },
  { id: 'TRX-002', time: '09:42', table: 'Take Away', kasir: 'Budi', total: 38000, items: 1, status: 'Selesai', type: 'Take Away', payment: 'QRIS' },
  { id: 'TRX-003', time: '10:05', table: 'Meja 7', kasir: 'Budi', total: 128000, items: 4, status: 'Proses', type: 'Dine-in', payment: '-' },
  { id: 'TRX-004', time: '10:30', table: 'Meja 1', kasir: 'Budi', total: 70000, items: 2, status: 'Selesai', type: 'Dine-in', payment: 'Transfer' },
];

export const MOCK_ORDERS_KDS = [
  { id: 'ORD-012', table: 'Meja 3', time: '2 menit lalu', status: 'new', items: [{ name: 'Latte', qty: 2, note: 'Less sugar' }, { name: 'Croissant', qty: 1, note: '' }] },
  { id: 'ORD-013', table: 'Meja 7', time: '8 menit lalu', status: 'cooking', items: [{ name: 'Nasi Goreng', qty: 1, note: 'Pedas' }, { name: 'Americano', qty: 1, note: '' }] },
  { id: 'ORD-014', table: 'Take Away', time: '12 menit lalu', status: 'ready', items: [{ name: 'Caramel Macchiato', qty: 1, note: '' }, { name: 'Donat', qty: 2, note: '' }] },
  { id: 'ORD-015', table: 'Meja 2', time: '1 menit lalu', status: 'new', items: [{ name: 'Cappuccino', qty: 2, note: '' }] },
];

export const MOCK_TABLES = [
  { id: 1, name: 'Meja 1', capacity: 4, status: 'occupied', order: 'ORD-011' },
  { id: 2, name: 'Meja 2', capacity: 2, status: 'occupied', order: 'ORD-015' },
  { id: 3, name: 'Meja 3', capacity: 4, status: 'occupied', order: 'ORD-012' },
  { id: 4, name: 'Meja 4', capacity: 6, status: 'available', order: null },
  { id: 5, name: 'Meja 5', capacity: 2, status: 'available', order: null },
  { id: 6, name: 'Meja 6', capacity: 4, status: 'available', order: null },
  { id: 7, name: 'Meja 7', capacity: 4, status: 'occupied', order: 'ORD-013' },
  { id: 8, name: 'Meja 8', capacity: 8, status: 'available', order: null },
  { id: 9, name: 'Meja 9', capacity: 2, status: 'reserved', order: null },
  { id: 10, name: 'Teras 1', capacity: 4, status: 'available', order: null },
  { id: 11, name: 'Teras 2', capacity: 4, status: 'available', order: null },
  { id: 12, name: 'VIP Room', capacity: 10, status: 'available', order: null },
];

export const formatRupiah = (num) =>
  'Rp ' + Number(num).toLocaleString('id-ID');
