const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { supabase } = require('./supabase');
const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'db', 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---- Simple JSON "Database" ----
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) return initDB();
  try { 
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); 
    if (!data.suppliers) data.suppliers = [];
    if (!data.purchase_orders) data.purchase_orders = [];
    if (!data.inventory_meta) data.inventory_meta = { categories: [], packageUnits: [], itemUnits: [] };
    return data;
  }
  catch { return initDB(); }
};

const writeDB = (data) => {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const initDB = () => {
  const initial = {
    users: [
      { id: 1, name: 'Ahmad Fauzi', username: 'admin', password: 'admin123', role: 'admin', avatar: 'AF', permissions: { all: true } },
      { id: 2, name: 'Siti Rahayu', username: 'owner', password: 'owner123', role: 'owner', avatar: 'SR', permissions: { all: true } },
      { id: 3, name: 'Budi Santoso', username: 'kasir', password: 'kasir123', role: 'kasir', avatar: 'BS', permissions: { akses_kasir: true } },
      { id: 4, name: 'Dewi Lestari', username: 'koki', password: 'koki123', role: 'koki', avatar: 'DL', permissions: { akses_dapur: true } },
      { id: 5, name: 'Rizky Pratama', username: 'gudang', password: 'gudang123', role: 'gudang', avatar: 'RP', permissions: { akses_gudang: true } },
    ],
    menu: [],
    bahan: [],
    transactions: [],
    orders: [],
    customers: [
      { id: 1001, name: 'Budi Pelanggan', phone: '08123456789', password: 'user123', points: 150, email: 'budi@gmail.com', role: 'customer' }
    ],
    tables: [
      { id: 1, name: 'Meja 1', capacity: 2, status: 'available' },
      { id: 2, name: 'Meja 2', capacity: 2, status: 'available' },
      { id: 3, name: 'Meja 3', capacity: 4, status: 'occupied' },
      { id: 4, name: 'Meja 4', capacity: 4, status: 'available' },
      { id: 5, name: 'Sofa A', capacity: 6, status: 'reserved' }
    ],
    shifts: [],
    suppliers: [
      { id: 1, name: 'Toko Biji Kopi Makmur', contact: '081234567890', address: 'Jl. Kopi No 1' },
      { id: 2, name: 'Susu Segar Abadi', contact: '089876543210', address: 'Jl. Susu No 2' }
    ],
    purchase_orders: [],
    settings: { storeName: 'BrewMaster Coffee', tax: 10, serviceCharge: 5, rewardEnabled: true },
    locations: [
      { id: 1, name: 'Gudang Utama', type: 'Warehouse' },
      { id: 2, name: 'Bar', type: 'Kitchen' }
    ],
    inventory_meta: {
      categories: ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'],
      packageUnits: ['Karton', 'Dus', 'Ball', 'Box'],
      itemUnits: ['Botol', 'Pcs', 'Gram', 'ML', 'Sachet', 'Kg', 'Liter']
    }
  };
  writeDB(initial);
  return initial;
};

// ---- AUTH ----
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  let user;
  if (role === 'customer') {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`email.eq.${username},phone.eq.${username}`)
      .eq('password', password)
      .single();
    user = data;
  } else {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('role', role)
      .single();
    user = data;
  }

  if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });
  
  const { password: _, ...safeUser } = user;
  res.json({ user: { ...safeUser, role: role || user.role }, token: 'supabase-token-' + user.id });
});

// ---- USERS ----
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, name, username, role, avatar, permissions');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
app.put('/api/users/:id', async (req, res) => {
  const { error } = await supabase.from('users').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete('/api/users/:id', async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- UPLOAD GAMBAR ----
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// ---- MENU ----
app.get('/api/menu', async (req, res) => {
  const { data, error } = await supabase.from('menu').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/menu', async (req, res) => {
  const { bom, ...menuData } = req.body;
  
  // 1. Simpan Menu
  const { data: newMenu, error: menuError } = await supabase.from('menu').insert([menuData]).select().single();
  if (menuError) return res.status(500).json({ error: menuError.message });

  // 2. Simpan Resep (BOM) jika ada
  if (bom && Array.isArray(bom)) {
    const bomData = bom.map(b => ({
      menu_id: newMenu.id,
      bahan_id: Number(b.bahanId),
      qty: Number(b.qty)
    }));
    await supabase.from('menu_bom').insert(bomData);
  }

  res.json(newMenu);
});
app.put('/api/menu/:id', async (req, res) => {
  const { bom, ...menuData } = req.body;
  const menuId = req.params.id;

  // 1. Update Menu
  const { error: menuError } = await supabase.from('menu').update(menuData).eq('id', menuId);
  if (menuError) return res.status(500).json({ error: menuError.message });

  // 2. Update Resep (Hapus lama, isi baru)
  if (bom && Array.isArray(bom)) {
    await supabase.from('menu_bom').delete().eq('menu_id', menuId);
    const bomData = bom.map(b => ({
      menu_id: menuId,
      bahan_id: Number(b.bahanId),
      qty: Number(b.qty)
    }));
    await supabase.from('menu_bom').insert(bomData);
  }

  res.json({ ok: true });
});
app.delete('/api/menu/:id', async (req, res) => {
  const { error } = await supabase.from('menu').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- BAHAN BAKU ----
app.get('/api/bahan', async (req, res) => {
  const { data, error } = await supabase.from('bahan').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/bahan', async (req, res) => {
  const { data, error } = await supabase.from('bahan').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
app.put('/api/bahan/:id', async (req, res) => {
  const { error } = await supabase.from('bahan').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete('/api/bahan/:id', async (req, res) => {
  const { error } = await supabase.from('bahan').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- TRANSAKSI ----
app.get('/api/transactions', async (req, res) => {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/transactions', async (req, res) => {
  const body = req.body;
  const isSelfOrder = body.cashierName === 'Self Service';
  const paymentStatus = isSelfOrder ? 'pending_payment' : 'paid';
  
  // Ambil count untuk generate ID
  const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  const trxId = 'TRX-' + String((count || 0) + 1).padStart(4, '0');

  const trxData = {
    id: trxId,
    total: body.total,
    subtotal: body.subtotal,
    tax_amount: body.taxAmount || 0,
    payment_method: body.paymentMethod,
    payment_status: paymentStatus,
    cashier_name: body.cashierName,
    customer_name: body.customerName || 'Tamu',
  };

  // Simpan Header Transaksi
  const { error: trxError } = await supabase.from('transactions').insert([trxData]);
  if (trxError) return res.status(500).json({ error: trxError.message });

  // Simpan Detail Item
  if (body.items && body.items.length > 0) {
    const itemsToInsert = body.items.map(item => ({
      transaction_id: trxId,
      menu_id: item.id,
      qty: item.qty,
      price: item.price
    }));
    await supabase.from('transaction_items').insert(itemsToInsert);

    // --- LOGIKA POTONG STOK (BOM) ---
    if (!isSelfOrder) {
      for (const cartItem of body.items) {
        // Cari resep untuk menu ini
        const { data: boms } = await supabase
          .from('menu_bom')
          .select('bahan_id, qty, bahan(unit, stock)')
          .eq('menu_id', cartItem.id);

        if (boms && boms.length > 0) {
          for (const bom of boms) {
            let ratio = 1;
            const u = (bom.bahan.unit || '').toLowerCase();
            // Konversi kg/liter ke gram/ml jika perlu
            if (['kg', 'kilogram', 'liter', 'l'].includes(u)) ratio = 1000;
            
            const deduction = (Number(bom.qty) / ratio) * cartItem.qty;
            const newStock = Math.max(0, Number(bom.bahan.stock) - deduction);
            
            // Update stok bahan baku di Supabase
            await supabase.from('bahan').update({ stock: newStock }).eq('id', bom.bahan_id);
          }
        }
      }
    }
  }

  res.json({ ...trxData, items: body.items });
});

// ---- KONFIRMASI PEMBAYARAN (Kasir) ----
app.post('/api/webhook/ojol', (req, res) => {
  const db = readDB();
  const body = req.body;
  
  // Format body webhook Ojol simulasi:
  // { platform: 'GoFood', orderId: 'GF-123', items: [{id, name, qty, price}], total: 50000, customerName: 'Budi' }
  const trx = {
    id: 'OJOL-' + String(db.transactions.length + 1).padStart(4, '0'),
    externalId: body.orderId,
    type: 'Delivery',
    tableType: body.platform, // Kita pakai tableType untuk menyimpan nama platform (GoFood/ShopeeFood/GrabFood)
    paymentMethod: body.platform,
    cashierName: 'Sistem Ojol',
    customerName: body.customerName || 'Pelanggan Ojol',
    items: body.items || [],
    subtotal: body.total,
    taxAmount: 0,
    discountAmount: 0,
    total: body.total,
    createdAt: new Date().toISOString(),
    paymentStatus: 'pending_acceptance', // Kasir harus menekan tombol terima
    kdsStatus: null,
    paidAt: null
  };

  db.transactions.push(trx); writeDB(db);
  res.json({ ok: true, message: 'Pesanan Ojol berhasil diterima', id: trx.id });
});

// Endpoint untuk simulasi Payment Gateway Webhook (Midtrans/Xendit)
app.post('/api/payments/webhook', (req, res) => {
  const db = readDB();
  const { orderId, status, paymentMethod, total } = req.body;
  const trx = db.transactions.find(t => t.id === orderId);
  
  if (!trx) return res.status(404).json({ error: 'Transaction not found' });
  if (trx.paymentStatus === 'paid') return res.json({ ok: true, message: 'Already paid' });

  if (status === 'success') {
    trx.paymentStatus = 'paid';
    trx.kdsStatus = 'new';           // Masuk KDS dapur otomatis tanpa kasir
    trx.paidAt = new Date().toISOString();
    trx.cashierName = 'Auto (Payment Gateway)';
    trx.cashReceived = total || trx.total;
    trx.change = 0;
    if (paymentMethod) trx.paymentMethod = paymentMethod;

    // Kurangi stok BOM
    if (trx.items && Array.isArray(trx.items)) {
      trx.items.forEach(cartItem => {
        const menuItem = db.menu.find(m => m.id === cartItem.id);
        if (menuItem?.bom?.length > 0) {
          menuItem.bom.forEach(bomRow => {
            const bahan = db.bahan.find(b => b.id === Number(bomRow.bahanId));
            if (bahan) bahan.stock = Math.max(0, bahan.stock - (Number(bomRow.qty) * cartItem.qty));
          });
        }
      });
    }

    writeDB(db);
    return res.json({ ok: true, message: 'Payment confirmed via webhook' });
  }

  res.json({ ok: false, message: 'Unhandled status' });
});

app.put('/api/transactions/:id/confirm-payment', (req, res) => {
  const db = readDB();
  const trx = db.transactions.find(t => t.id === req.params.id);
  if (!trx) return res.status(404).json({ error: 'Transaction not found' });

  const { cashReceived, change, paymentMethod } = req.body;

  trx.paymentStatus = 'paid';
  trx.kdsStatus = 'new';           // Sekarang baru masuk KDS
  trx.paidAt = new Date().toISOString();
  trx.cashierName = req.body.cashierName || 'Kasir';
  if (cashReceived !== undefined) trx.cashReceived = cashReceived;
  if (change !== undefined) trx.change = change;
  if (paymentMethod) trx.paymentMethod = paymentMethod;

  // Kurangi stok BOM setelah pembayaran dikonfirmasi
  if (trx.items && Array.isArray(trx.items)) {
    trx.items.forEach(cartItem => {
      const menuItem = db.menu.find(m => m.id === cartItem.id);
      if (menuItem?.bom?.length > 0) {
        menuItem.bom.forEach(bomRow => {
          const bahan = db.bahan.find(b => b.id === Number(bomRow.bahanId));
          if (bahan) bahan.stock = Math.max(0, bahan.stock - (Number(bomRow.qty) * cartItem.qty));
        });
      }
    });
  }

  writeDB(db);
  res.json(trx);
});
app.put('/api/transactions/:id/kds', (req, res) => {
  const db = readDB();
  const trx = db.transactions.find(t => t.id === req.params.id);
  if (!trx) return res.status(404).json({ error: 'Transaction not found' });

  const prevStatus = trx.kdsStatus;
  trx.kdsStatus = req.body.status;

  // Saat status menjadi 'served' → tambah poin member (jika ada)
  if (req.body.status === 'served' && prevStatus !== 'served') {
    const settings = db.settings || {};
    const pointsPerRp = settings.pointsPerRp || 10000; // default: 1 poin per Rp 10.000
    const rewardEnabled = settings.rewardEnabled !== false;

    if (rewardEnabled && trx.customerPhone) {
      const customer = (db.customers || []).find(
        c => c.phone === trx.customerPhone || c.email === trx.customerPhone
      );
      if (customer) {
        const earnedPoints = Math.floor((trx.total || 0) / pointsPerRp);
        customer.points = (customer.points || 0) + earnedPoints;
        customer.totalSpend = (customer.totalSpend || 0) + (trx.total || 0);
        customer.visits = (customer.visits || 0) + 1;
        trx.pointsEarned = earnedPoints;
      }
    }
    trx.servedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json(trx);
});

// ---- TABLES ----
app.get('/api/tables', async (req, res) => {
  const { data, error } = await supabase.from('tables').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/tables', async (req, res) => {
  const { data, error } = await supabase.from('tables').insert([{ ...req.body, status: 'available' }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
app.put('/api/tables/:id', async (req, res) => {
  const { error } = await supabase.from('tables').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete('/api/tables/:id', async (req, res) => {
  const { error } = await supabase.from('tables').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- SHIFTS ----
app.get('/api/shifts', (req, res) => res.json(readDB().shifts));
app.post('/api/shifts', (req, res) => {
  const db = readDB();
  const shift = { ...req.body, id: Date.now(), status: 'open', startTime: new Date().toISOString() };
  db.shifts.push(shift); writeDB(db); res.json(shift);
});
app.put('/api/shifts/:id', (req, res) => {
  const db = readDB();
  db.shifts = db.shifts.map(s => s.id === Number(req.params.id) ? { ...s, ...req.body, endTime: req.body.status === 'closed' ? new Date().toISOString() : s.endTime } : s);
  writeDB(db); res.json({ ok: true });
});

// ---- SETTINGS ----
app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/settings', async (req, res) => {
  const { data, error } = await supabase.from('settings').update(req.body).eq('id', 1).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---- CUSTOMERS ----
app.get('/api/customers', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/customers', async (req, res) => {
  const { data, error } = await supabase.from('customers').insert([{ 
    ...req.body, 
    points: 0, 
    total_spend: 0, 
    visits: 0, 
    join_date: new Date().toISOString().split('T')[0] 
  }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// ---- SUPPLIERS ----
app.get('/api/suppliers', (req, res) => res.json(readDB().suppliers));
app.post('/api/suppliers', (req, res) => {
  const db = readDB();
  const item = { ...req.body, id: Date.now() };
  db.suppliers.push(item); writeDB(db); res.json(item);
});
app.put('/api/suppliers/:id', (req, res) => {
  const db = readDB();
  db.suppliers = db.suppliers.map(s => s.id === Number(req.params.id) ? { ...s, ...req.body } : s);
  writeDB(db); res.json({ ok: true });
});
app.delete('/api/suppliers/:id', (req, res) => {
  const db = readDB();
  db.suppliers = db.suppliers.filter(s => s.id !== Number(req.params.id));
  writeDB(db); res.json({ ok: true });
});

// ---- PURCHASE ORDERS ----
app.get('/api/po', (req, res) => res.json(readDB().purchase_orders));
app.post('/api/po', (req, res) => {
  const db = readDB();
  const poNum = 'PO-' + String(db.purchase_orders.length + 1).padStart(4, '0');
  const item = { ...req.body, id: Date.now(), poNumber: poNum, status: 'Pending', createdAt: new Date().toISOString() };
  db.purchase_orders.push(item); writeDB(db); res.json(item);
});
app.put('/api/po/:id', (req, res) => {
  const db = readDB();
  const poId = Number(req.params.id);
  const existingPo = db.purchase_orders.find(p => p.id === poId);
  if (!existingPo) return res.status(404).json({ error: 'PO not found' });

  const { status, items: updatedItems } = req.body;
  
  if (status === 'Diterima' && existingPo.status !== 'Diterima') {
    // Process receiving items and updating stock
    if (updatedItems && Array.isArray(updatedItems)) {
      updatedItems.forEach(receivedItem => {
        // Cari bahan dengan ID dan lokasi yang sesuai
        const targetLocation = existingPo.location || 'Gudang Utama';
        let bahan = db.bahan.find(b => b.id === Number(receivedItem.bahanId) && b.location === targetLocation);
        
        if (bahan) {
          bahan.stock += Number(receivedItem.receivedQty);
        } else {
          // Jika belum ada bahan tersebut di lokasi tujuan, buat baru berdasarkan master data
          const masterBahan = db.bahan.find(b => b.id === Number(receivedItem.bahanId));
          if (masterBahan) {
            db.bahan.push({
              ...masterBahan,
              id: Date.now() + Math.floor(Math.random() * 1000), // Generate new ID for new location entry
              stock: Number(receivedItem.receivedQty),
              location: targetLocation
            });
          }
        }
      });
      existingPo.items = updatedItems; // update PO items with receivedQty
    }
  }

  existingPo.status = status;
  writeDB(db); res.json(existingPo);
});

app.get('/api/locations', async (req, res) => {
  const { data, error } = await supabase.from('locations').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/locations', async (req, res) => {
  const { data, error } = await supabase.from('locations').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
app.delete('/api/locations/:id', async (req, res) => {
  const { error } = await supabase.from('locations').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- STOCK TRANSFER ----
app.post('/api/stock-transfer', async (req, res) => {
  const { bahanId, fromLocation, toLocation, qty } = req.body;
  const quantity = Number(qty);
  
  const { data: source, error: e1 } = await supabase.from('bahan').select('*').eq('id', bahanId).single();
  if (e1 || !source) return res.status(404).json({ error: 'Bahan tidak ditemukan' });
  
  await supabase.from('bahan').update({ stock: source.stock - quantity }).eq('id', bahanId);

  const { data: target, error: e2 } = await supabase.from('bahan')
    .select('*').eq('name', source.name).eq('location', toLocation).single();

  if (target) {
    await supabase.from('bahan').update({ stock: target.stock + quantity }).eq('id', target.id);
  } else {
    const { id, ...rest } = source;
    await supabase.from('bahan').insert([{ ...rest, location: toLocation, stock: quantity }]);
  }
  res.json({ ok: true });
});

// ---- INVENTORY META ----
app.get('/api/inventory/meta', async (req, res) => {
  const { data, error } = await supabase.from('inventory_meta').select('*').single();
  if (error) return res.json({ categories: [], packageUnits: [], itemUnits: [] });
  res.json(data);
});
app.post('/api/inventory/meta', async (req, res) => {
  const { data, error } = await supabase.from('inventory_meta').upsert({ id: 1, ...req.body }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});


// ---- LAPORAN & ANALITIK ----
function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') {
    return { start: today, end: new Date(today.getTime() + 86400000) };
  } else if (period === '7days') {
    return { start: new Date(today.getTime() - 6 * 86400000), end: new Date(today.getTime() + 86400000) };
  } else if (period === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000) };
  } else if (period === 'year') {
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(today.getTime() + 86400000) };
  } else if (period === 'custom' && customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(new Date(customEnd).getTime() + 86400000) };
  }
  return { start: today, end: new Date(today.getTime() + 86400000) };
}

function filterTrx(transactions, start, end) {
  return transactions.filter(t => {
    if (t.type === 'Transfer') return false;
    const d = new Date(t.createdAt || t.paidAt);
    return d >= start && d < end && t.paymentStatus === 'paid';
  });
}

app.get('/api/laporan/summary', async (req, res) => {
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);

  // Ambil transaksi dari Supabase dalam rentang waktu tertentu
  const { data: trx, error } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .eq('payment_status', 'paid');

  if (error) return res.status(500).json({ error: error.message });

  const totalRevenue = trx.reduce((s, t) => s + Number(t.total || 0), 0);
  const totalTransactions = trx.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  res.json({
    totalRevenue,
    totalTransactions,
    avgTransaction,
    grossProfit: totalRevenue * 0.7, // Estimasi margin 70% jika data HPP belum lengkap
    vsYesterday: { revenue: 0, transactions: 0 } // Bisa dikembangkan lebih lanjut
  });
});

app.get('/api/laporan/trend', (req, res) => {
  const db = readDB();
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const periodMs = end - start;
  const prevStart = new Date(start.getTime() - periodMs);

  const buildHourly = (trxList, refStart) => {
    const hours = {};
    trxList.forEach(t => {
      const d = new Date(t.createdAt || t.paidAt);
      const h = d.getHours();
      hours[h] = (hours[h] || 0) + (t.total || 0);
    });
    return Array.from({ length: 24 }, (_, i) => ({ hour: i, value: hours[i] || 0 }));
  };

  const current = filterTrx(db.transactions, start, end);
  const previous = filterTrx(db.transactions, prevStart, start);

  res.json({
    current: buildHourly(current, start),
    previous: buildHourly(previous, prevStart)
  });
});

app.get('/api/laporan/payment-methods', (req, res) => {
  const db = readDB();
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const trx = filterTrx(db.transactions, start, end);

  const methods = {};
  trx.forEach(t => {
    const m = t.paymentMethod || 'Cash';
    methods[m] = (methods[m] || 0) + (t.total || 0);
  });
  const total = Object.values(methods).reduce((s, v) => s + v, 0);
  const result = Object.entries(methods).map(([name, amount]) => ({
    name, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  res.json({ methods: result, total });
});

app.get('/api/laporan/top-products', (req, res) => {
  const db = readDB();
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const trx = filterTrx(db.transactions, start, end);

  const products = {};
  trx.forEach(t => {
    (t.items || []).forEach(item => {
      if (!products[item.id]) {
        products[item.id] = { id: item.id, name: item.name, icon: item.icon || '☕', qty: 0, revenue: 0, cost: 0 };
      }
      products[item.id].qty += item.qty || 1;
      products[item.id].revenue += (item.price || 0) * (item.qty || 1);
      const menuItem = db.menu.find(m => m.id === item.id);
      products[item.id].cost += (menuItem?.cost || 0) * (item.qty || 1);
    });
  });

  const sorted = Object.values(products).sort((a, b) => b.qty - a.qty);
  res.json(sorted.slice(0, 10));
});

app.get('/api/laporan/critical-stock', (req, res) => {
  const db = readDB();
  const items = db.bahan.map(b => {
    const ratio = b.minStock > 0 ? b.stock / b.minStock : 1;
    let status = 'ok';
    if (b.stock === 0) status = 'habis';
    else if (ratio < 0.5) status = 'kritis';
    else if (ratio < 1) status = 'rendah';
    return { ...b, ratio, status };
  }).filter(b => b.status !== 'ok').sort((a, b) => a.ratio - b.ratio);

  res.json(items.slice(0, 10));
});

app.get('/api/laporan/waste', (req, res) => {
  const db = readDB();
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const trx = filterTrx(db.transactions, start, end);
  const totalRevenue = trx.reduce((s, t) => s + (t.total || 0), 0);

  const wasteItems = (db.waste || []).filter(w => {
    const d = new Date(w.date);
    return d >= start && d < end;
  });
  const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
  const categories = {};
  wasteItems.forEach(w => {
    const cat = w.category || 'Lainnya';
    categories[cat] = (categories[cat] || 0) + (w.amount || 0);
  });

  res.json({
    totalWaste, totalRevenue,
    wasteRatio: totalRevenue > 0 ? Math.round((totalWaste / totalRevenue) * 100 * 10) / 10 : 0,
    items: wasteItems.length,
    categories: Object.entries(categories).map(([name, amount]) => ({
      name, amount, pct: totalWaste > 0 ? Math.round((amount / totalWaste) * 100) : 0
    }))
  });
});

app.get('/api/laporan/insights', (req, res) => {
  const db = readDB();
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const trx = filterTrx(db.transactions, start, end);
  const totalRevenue = trx.reduce((s, t) => s + (t.total || 0), 0);
  const totalHPP = trx.reduce((s, t) => s + (t.items || []).reduce((ss, item) => {
    const menuItem = db.menu.find(m => m.id === item.id);
    return ss + ((menuItem?.cost || 0) * (item.qty || 1));
  }, 0), 0);

  const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
  const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
  const wasteRatio = totalRevenue > 0 ? (totalWaste / totalRevenue) * 100 : 0;
  const marginPct = totalRevenue > 0 ? ((totalRevenue - totalHPP) / totalRevenue) * 100 : 0;

  // Count product sales in last 7 days to find slow movers
  const sevenDaysAgo = new Date(end.getTime() - 7 * 86400000);
  const recentTrx = filterTrx(db.transactions, sevenDaysAgo, end);
  const recentProductIds = new Set();
  recentTrx.forEach(t => (t.items || []).forEach(item => recentProductIds.add(item.id)));
  const slowMovers = db.menu.filter(m => !recentProductIds.has(m.id)).slice(0, 3);

  const insights = [];
  if (wasteRatio > 3) {
    insights.push({ type: 'danger', icon: '⚠️', title: 'Waste Terlalu Tinggi', body: `Waste ${wasteRatio.toFixed(1)}% melebihi batas aman 3%. Evaluasi barista dan proses operasional.` });
  }
  slowMovers.forEach(m => {
    insights.push({ type: 'warning', icon: '🟡', title: 'Slow Moving Product', body: `${m.name} tidak terjual dalam 7 hari terakhir. Pertimbangkan promo atau hapus menu.` });
  });
  if (marginPct >= 60) {
    insights.push({ type: 'success', icon: '✅', title: 'Performa Baik', body: `Margin kotor ${marginPct.toFixed(0)}% di atas target minimal 60%. Pertahankan performa ini!` });
  }
  if (trx.length === 0) {
    insights.push({ type: 'info', icon: 'ℹ️', title: 'Belum Ada Transaksi', body: 'Belum ada transaksi pada periode ini. Data akan muncul setelah ada penjualan.' });
  }

  res.json(insights);
});


// ---- LAPORAN REPORT DATA (for PDF/Excel generation) ----
app.get('/api/laporan/report/:type', (req, res) => {
  const db = readDB();
  const { type } = req.params;
  const { period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  const settings = db.settings || {};
  const storeName = settings.storeName || 'BrewMaster Coffee';
  const storeAddress = settings.address || 'Jl. Kopi Nikmat No. 1, Jakarta';
  const storePhone = settings.phone || 'Telp. 021-1234567';
  const now = new Date().toLocaleString('id-ID');
  const periodLabel = period === 'today' ? `Tanggal : ${start.toLocaleDateString('id-ID')}` : `Periode : ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime()-1).toLocaleDateString('id-ID')}`;

  const trx = filterTrx(db.transactions, start, end);
  const totalRevenue = trx.reduce((s, t) => s + (t.total || 0), 0);
  const totalHPP = trx.reduce((s, t) => s + (t.items || []).reduce((ss, item) => {
    const m = db.menu.find(x => x.id === item.id);
    return ss + ((m?.cost || 0) * (item.qty || 1));
  }, 0), 0);

  const meta = { storeName, storeAddress, storePhone, periodLabel, printedAt: now, period };

  if (type === 'penjualan-harian') {
    const memberTrx = trx.filter(t => t.customerName && t.customerName !== 'Tamu');
    const guestTrx = trx.filter(t => !t.customerName || t.customerName === 'Tamu');
    const byMethod = {};
    trx.forEach(t => { const m = t.paymentMethod || 'Cash'; byMethod[m] = (byMethod[m] || 0) + (t.total || 0); });
    const cash = byMethod['Cash'] || 0;
    const cashless = totalRevenue - cash;
    return res.json({
      meta, type: 'penjualan-harian', title: 'Laporan Penjualan Harian',
      summary: { totalTrx: trx.length, memberTrx: memberTrx.length, guestTrx: guestTrx.length, grossSales: totalRevenue, discount: 0, netSales: totalRevenue },
      memberSales: memberTrx.reduce((s,t)=>s+(t.total||0),0),
      guestSales: guestTrx.reduce((s,t)=>s+(t.total||0),0),
      payment: { cash, cashless, total: totalRevenue, selisih: 0 },
      byMethod: Object.entries(byMethod).map(([name, amount]) => ({ name, amount }))
    });
  }

  if (type === 'penjualan-periode') {
    const byDay = {};
    trx.forEach(t => {
      const d = new Date(t.createdAt||t.paidAt).toLocaleDateString('id-ID');
      byDay[d] = (byDay[d]||0) + (t.total||0);
    });
    return res.json({ meta, type, title: 'Laporan Penjualan Periode', summary: { totalRevenue, totalTrx: trx.length, grossSales: totalRevenue, discount: 0, netSales: totalRevenue }, byDay });
  }

  if (type === 'inventaris') {
    const items = db.bahan.map(b => {
      const ratio = b.minStock > 0 ? b.stock / b.minStock : 2;
      const status = b.stock === 0 ? 'Habis' : ratio < 0.5 ? 'Kritis' : ratio < 1 ? 'Rendah' : 'Aman';
      return { ...b, status };
    });
    const critical = items.filter(b => b.status === 'Kritis' || b.status === 'Habis').length;
    const empty = items.filter(b => b.status === 'Habis').length;
    return res.json({ meta, type, title: 'Laporan Inventaris (Stok)', items, summary: { total: items.length, critical, empty } });
  }

  if (type === 'waste') {
    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s,w) => s+(w.amount||0), 0);
    const wasteRatio = totalRevenue > 0 ? ((totalWaste/totalRevenue)*100).toFixed(2) : 0;
    const categories = {};
    wasteItems.forEach(w => { categories[w.category||'Lainnya'] = (categories[w.category||'Lainnya']||0)+(w.amount||0); });
    return res.json({ meta, type, title: 'Laporan Waste (Kerugian)', summary: { totalWaste, wasteRatio, status: wasteRatio > 3 ? 'PERLU PERHATIAN' : 'Normal', totalRevenue }, items: wasteItems, categories: Object.entries(categories).map(([name,amount])=>({name,amount})) });
  }

  if (type === 'hpp') {
    const products = {};
    trx.forEach(t => (t.items||[]).forEach(item => {
      const m = db.menu.find(x => x.id === item.id);
      if (!m) return;
      const k = item.id;
      if (!products[k]) products[k] = { name: item.name, unit: m.unit||'Pcs', stokAwal: 0, pembelian: 0, stokAkhir: 0, terpakai: 0, hargaSatuan: m.cost||0, totalHPP: 0 };
      products[k].terpakai += item.qty||1;
      products[k].totalHPP += (m.cost||0) * (item.qty||1);
    }));
    const rows = Object.values(products);
    const foodCostPct = totalRevenue > 0 ? ((totalHPP/totalRevenue)*100).toFixed(2) : 0;
    return res.json({ meta, type, title: 'Laporan HPP (COGS)', rows, summary: { totalRevenue, totalHPP, foodCostPct } });
  }

  if (type === 'laba-rugi') {
    const wasteItems = (db.waste||[]).filter(w => { const d = new Date(w.date); return d>=start&&d<end; });
    const totalWaste = wasteItems.reduce((s,w)=>s+(w.amount||0),0);
    const opEx = { gaji: 0, sewa: 0, utilitas: 0, lainnya: 0 };
    const totalOpEx = Object.values(opEx).reduce((s,v)=>s+v,0);
    const labaKotor = totalRevenue - totalHPP;
    const labaBersih = labaKotor - totalOpEx - totalWaste;
    return res.json({ meta, type, title: 'Laporan Laba Rugi', pendapatan: { penjualanNetto: totalRevenue, total: totalRevenue }, hpp: totalHPP, labaKotor, opEx, totalOpEx, waste: totalWaste, labaBersih, marginPct: totalRevenue > 0 ? ((labaBersih/totalRevenue)*100).toFixed(1) : 0 });
  }

  if (type === 'owner-dashboard') {
    const products = {};
    trx.forEach(t => (t.items||[]).forEach(item => {
      if (!products[item.id]) products[item.id] = { name: item.name, icon: item.icon||'☕', qty: 0, revenue: 0 };
      products[item.id].qty += item.qty||1;
      products[item.id].revenue += (item.price||0)*(item.qty||1);
    }));
    const bestSellers = Object.values(products).sort((a,b)=>b.qty-a.qty).slice(0,5);
    const wasteItems = (db.waste||[]).filter(w=>{const d=new Date(w.date);return d>=start&&d<end;});
    const totalWaste = wasteItems.reduce((s,w)=>s+(w.amount||0),0);
    const labaKotor = totalRevenue - totalHPP;
    const marginPct = totalRevenue > 0 ? ((labaKotor/totalRevenue)*100).toFixed(1) : 0;
    const hours = {};
    trx.forEach(t => { const h = new Date(t.createdAt||t.paidAt).getHours(); hours[h] = (hours[h]||0) + (t.total||0); });
    const trendJam = Array.from({length:24},(_,i)=>({hour:i, value: hours[i]||0}));
    return res.json({ meta, type, title: 'Dashboard Ringkasan Owner', kpi: { totalRevenue, totalHPP, totalWaste, labaKotor, marginPct, totalTrx: trx.length }, bestSellers, trendJam });
  }

  if (type === 'stok-opname') {
    const items = db.bahan.map(b => {
      const fisik = b.stock; // In real system, physical count would differ
      const sistem = b.stock;
      const selisih = fisik - sistem;
      const selisihPct = sistem > 0 ? ((selisih/sistem)*100).toFixed(2) : 0;
      return { ...b, fisik, sistem, selisih, selisihPct };
    });
    const totalSelisih = items.reduce((s,b)=>s+(b.selisih*b.price),0);
    const itemSelisih = items.filter(b=>b.selisih!==0).length;
    return res.json({ meta, type, title: 'Laporan Stok Opname', items, summary: { total: items.length, itemSelisih, totalSelisih } });
  }

  res.status(404).json({ error: 'Tipe laporan tidak ditemukan' });
});

// ---- EXCEL REPORT DOWNLOAD ----
app.get('/api/report/excel', async (req, res) => {
  const db = readDB();
  const { type = 'all', period = 'today', customStart, customEnd } = req.query;
  const { start, end } = getDateRange(period, customStart, customEnd);
  
  const trx = filterTrx(db.transactions, start, end);
  const totalRevenue = trx.reduce((s, t) => s + (t.total || 0), 0);
  const totalHPP = trx.reduce((s, t) => s + (t.items || []).reduce((ss, item) => {
    const m = db.menu.find(x => x.id === item.id);
    return ss + ((m?.cost || 0) * (item.qty || 1));
  }, 0), 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BrewMaster System';
  workbook.created = new Date();

  const titleFont = { name: 'Arial', family: 4, size: 14, bold: true };
  const headerFont = { name: 'Arial', family: 4, size: 11, bold: true };
  const borderAll = {
    top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
  };
  const alignCenter = { vertical: 'middle', horizontal: 'center' };
  const currencyFmt = '"Rp"#,##0';

  const addPenjualanSheet = () => {
    const sheet = workbook.addWorksheet('Penjualan');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Waktu', key: 'time', width: 20 },
      { header: 'ID Transaksi', key: 'id', width: 15 },
      { header: 'Pelanggan', key: 'customer', width: 20 },
      { header: 'Metode', key: 'method', width: 15 },
      { header: 'Total (Rp)', key: 'total', width: 15 }
    ];
    sheet.insertRow(1, ['LAPORAN PENJUALAN']);
    sheet.getCell('A1').font = titleFont;
    sheet.mergeCells('A1:F1');
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime()-1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Waktu', 'ID Transaksi', 'Pelanggan', 'Metode Pembayaran', 'Total (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; });

    let rIdx = 5;
    trx.forEach((t, i) => {
      const row = sheet.insertRow(rIdx++, [
        i+1, new Date(t.createdAt||t.paidAt).toLocaleString('id-ID'), t.id, 
        t.customerName || 'Tamu', t.paymentMethod || 'Cash', t.total || 0
      ]);
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['','','','','TOTAL PENJUALAN', totalRevenue]);
    totalRow.font = headerFont;
    totalRow.getCell(6).numFmt = currencyFmt;
    totalRow.eachCell(c => c.border = borderAll);
  };

  const addInventarisSheet = () => {
    const sheet = workbook.addWorksheet('Inventaris');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Bahan', key: 'name', width: 25 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Stok Saat Ini', key: 'stock', width: 15 },
      { header: 'Stok Minimum', key: 'min', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    sheet.insertRow(1, ['LAPORAN INVENTARIS (STOK)']);
    sheet.getCell('A1').font = titleFont;
    sheet.mergeCells('A1:F1');
    sheet.insertRow(2, [`Tanggal: ${new Date().toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Nama Bahan', 'Satuan', 'Stok Saat Ini', 'Stok Minimum', 'Status'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; });

    let rIdx = 5;
    db.bahan.forEach((b, i) => {
      const ratio = b.minStock > 0 ? b.stock / b.minStock : 2;
      const status = b.stock === 0 ? 'Habis' : ratio < 0.5 ? 'Kritis' : ratio < 1 ? 'Rendah' : 'Aman';
      const row = sheet.insertRow(rIdx++, [i+1, b.name, b.unit, b.stock, b.minStock, status]);
      row.eachCell(c => c.border = borderAll);
      if (status !== 'Aman') {
        row.getCell(6).font = { color: { argb: status === 'Habis' || status === 'Kritis' ? 'FFFF0000' : 'FFFFA500' }, bold: true };
      }
    });
  };

  const addWasteSheet = () => {
    const sheet = workbook.addWorksheet('Waste');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Bahan', key: 'name', width: 25 },
      { header: 'Alasan', key: 'cat', width: 20 },
      { header: 'Jumlah', key: 'qty', width: 10 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Nilai Kerugian (Rp)', key: 'amt', width: 20 }
    ];
    sheet.insertRow(1, ['LAPORAN WASTE (KERUGIAN)']);
    sheet.getCell('A1').font = titleFont;
    sheet.mergeCells('A1:F1');
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime()-1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Nama Bahan', 'Alasan', 'Jumlah', 'Satuan', 'Nilai Kerugian (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; });

    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s,w) => s+(w.amount||0), 0);

    let rIdx = 5;
    wasteItems.forEach((w, i) => {
      const row = sheet.insertRow(rIdx++, [i+1, w.bahanName||'-', w.category||'Lainnya', w.qty||1, w.unit||'-', w.amount||0]);
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['','','','','TOTAL WASTE', totalWaste]);
    totalRow.font = headerFont;
    totalRow.getCell(6).numFmt = currencyFmt;
    totalRow.getCell(6).font = { color: { argb: 'FFFF0000' }, bold: true };
    totalRow.eachCell(c => c.border = borderAll);
  };

  const addHPPSheet = () => {
    const sheet = workbook.addWorksheet('HPP');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Bahan', key: 'name', width: 25 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Terpakai', key: 'used', width: 15 },
      { header: 'Harga Satuan (Rp)', key: 'price', width: 20 },
      { header: 'Total HPP (Rp)', key: 'total', width: 20 }
    ];
    sheet.insertRow(1, ['LAPORAN HPP (COGS)']);
    sheet.getCell('A1').font = titleFont;
    sheet.mergeCells('A1:F1');
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime()-1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Nama Bahan', 'Satuan', 'Terpakai', 'Harga Satuan (Rp)', 'Total HPP (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; });

    const products = {};
    trx.forEach(t => (t.items||[]).forEach(item => {
      const m = db.menu.find(x => x.id === item.id);
      if (!m) return;
      if (!products[item.id]) products[item.id] = { name: item.name, unit: m.unit||'Pcs', terpakai: 0, hargaSatuan: m.cost||0, totalHPP: 0 };
      products[item.id].terpakai += item.qty||1;
      products[item.id].totalHPP += (m.cost||0) * (item.qty||1);
    }));

    let rIdx = 5;
    Object.values(products).forEach((p, i) => {
      const row = sheet.insertRow(rIdx++, [i+1, p.name, p.unit, p.terpakai, p.hargaSatuan, p.totalHPP]);
      row.getCell(5).numFmt = currencyFmt;
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['','','','','TOTAL HPP', totalHPP]);
    totalRow.font = headerFont;
    totalRow.getCell(6).numFmt = currencyFmt;
    totalRow.eachCell(c => c.border = borderAll);
  };

  const addLabaRugiSheet = () => {
    const sheet = workbook.addWorksheet('Laba Rugi');
    sheet.columns = [
      { header: 'Keterangan', key: 'ket', width: 40 },
      { header: 'Nilai (Rp)', key: 'val', width: 25 }
    ];
    sheet.insertRow(1, ['LAPORAN LABA RUGI']);
    sheet.getCell('A1').font = titleFont;
    sheet.mergeCells('A1:B1');
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime()-1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:B2');
    sheet.insertRow(3, []);

    let rIdx = 4;
    const addSection = (title, items, totalLabel, totalVal, isNegative = false) => {
      const titleRow = sheet.insertRow(rIdx++, [title]);
      titleRow.font = headerFont;
      
      items.forEach(it => {
        const row = sheet.insertRow(rIdx++, [it.label, it.val * (isNegative ? -1 : 1)]);
        row.getCell(2).numFmt = currencyFmt;
      });
      
      const totalRow = sheet.insertRow(rIdx++, [totalLabel, totalVal * (isNegative ? -1 : 1)]);
      totalRow.font = headerFont;
      totalRow.getCell(2).numFmt = currencyFmt;
      totalRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; });
      sheet.insertRow(rIdx++, []);
    };

    const wasteItems = (db.waste||[]).filter(w => { const d = new Date(w.date); return d>=start&&d<end; });
    const totalWaste = wasteItems.reduce((s,w)=>s+(w.amount||0),0);
    const labaKotor = totalRevenue - totalHPP;
    const labaBersih = labaKotor - totalWaste; // Assuming 0 opEx for now since it's not fully stored in DB

    addSection('PENDAPATAN', [{label: 'Penjualan Netto', val: totalRevenue}], 'TOTAL PENDAPATAN', totalRevenue);
    addSection('HARGA POKOK PENJUALAN (HPP)', [{label: 'Total HPP', val: totalHPP}], 'LABA KOTOR', labaKotor, false);
    
    // Add Laba Kotor row separately to be positive
    sheet.getRow(rIdx - 2).getCell(2).value = labaKotor; // Fix the negative calculation for Laba Kotor
    
    addSection('BIAYA & LOSS', [{label: 'Waste / Loss', val: totalWaste}], 'TOTAL BIAYA', totalWaste, true);

    const netRow = sheet.insertRow(rIdx++, ['LABA BERSIH', labaBersih]);
    netRow.font = { ...titleFont, color: { argb: 'FFFFFFFF' } };
    netRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF6366F1'} }; });
    netRow.getCell(2).numFmt = currencyFmt;
  };

  try {
    if (type === 'penjualan') addPenjualanSheet();
    else if (type === 'inventaris') addInventarisSheet();
    else if (type === 'waste') addWasteSheet();
    else if (type === 'hpp') addHPPSheet();
    else if (type === 'labarugi') addLabaRugiSheet();
    else if (type === 'all') {
      addPenjualanSheet();
      addInventarisSheet();
      addWasteSheet();
      addHPPSheet();
      addLabaRugiSheet();
    } else {
      return res.status(400).json({ error: 'Tipe laporan Excel tidak valid' });
    }

    const filename = type === 'all' 
      ? `laporan-semua-${start.toISOString().slice(0,10)}.xlsx` 
      : `laporan-${type}-${start.toISOString().slice(0,10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Gagal membuat file Excel' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// --- PRODUCTION: Serve Frontend Static Files ---
// Asumsi struktur folder saat ini: backend ada di /backend dan frontend di /frontend
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Tangkap semua route selain /api dan kirim ke index.html (untuk React Router)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
    }
  });
} else {
  console.log('⚠️ Folder frontend/dist tidak ditemukan. Pastikan Anda telah menjalankan build frontend.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ BrewMaster Backend berjalan di port ${PORT}`);
  console.log(`📁 Database: ${DB_PATH}`);
  readDB(); // init if not exists
});
