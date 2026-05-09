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

// ---- FASE 6: RBAC & Tenant Isolation Middleware ----
const rbacMiddleware = async (req, res, next) => {
  const role = req.headers['x-user-role'] || 'guest';
  const tenantId = req.headers['x-tenant-id'] || null;

  // Bebaskan endpoint public
  if (req.path.includes('/login') || req.path.includes('/uploads')) return next();

  // BR-020: Isolasi Tenant (Inject ke req object)
  req.userContext = { role, tenantId };

  // Validasi Sederhana RBAC
  if (role === 'kasir' && req.method === 'DELETE') {
    return res.status(403).json({ error: 'RBAC: Role Kasir tidak diizinkan menghapus data.' });
  }

  next();
};
app.use(rbacMiddleware);

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
    // Fetch user and their tenant info in one go
    const { data, error } = await supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .eq('username', username)
      .eq('password', password)
      .eq('role', role)
      .single();
    user = data;
  }

  if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });

  // Check if tenant is active (if not superadmin)
  if (!user.is_superadmin && user.tenant && !user.tenant.is_active) {
    return res.status(403).json({ error: 'Akun bisnis Anda sedang dinonaktifkan. Silakan hubungi SuperAdmin.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ 
    user: { ...safeUser, role: role || user.role }, 
    token: 'supabase-token-' + user.id 
  });
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

    // --- LOGIKA POTONG STOK (HANYA DARI BAR/KITCHEN) ---
    if (!isSelfOrder) {
      for (const cartItem of body.items) {
        // 1. Cari resep (BOM) untuk menu ini
        const { data: boms } = await supabase.from('menu_bom').select('bahan_id, qty').eq('menu_id', cartItem.id);

        if (boms && boms.length > 0) {
          for (const bom of boms) {
            // 2. Cari info bahan asli (untuk ambil namanya)
            const { data: masterBahan } = await supabase.from('bahan').select('name, unit').eq('id', bom.bahan_id).single();
            if (!masterBahan) continue;

            // 3. CARI STOK DI BAR/KITCHEN (Lokasi Produksi)
            // Kita asumsikan minuman dari 'Bar' dan makanan dari 'Kitchen'
            const targetLocation = cartItem.category === 'Makanan' ? 'Kitchen' : 'Bar';

            const { data: prodBahan } = await supabase.from('bahan')
              .select('id, stock, unit')
              .eq('name', masterBahan.name)
              .eq('location', targetLocation)
              .single();

            if (prodBahan) {
              let ratio = 1;
              const u = (prodBahan.unit || '').toLowerCase();
              if (['kg', 'kilogram', 'liter', 'l'].includes(u)) ratio = 1000;

              const deduction = (Number(bom.qty) / ratio) * cartItem.qty;
              const newStock = Number(prodBahan.stock) - deduction;

              // 4. Update hanya stok di lokasi produksi (Bar/Kitchen)
              await supabase.from('bahan').update({ stock: newStock }).eq('id', prodBahan.id);

              // 5. FASE 3: Event-Based Movement
              await supabase.from('stock_movements').insert([{
                product_id: prodBahan.id,
                type: 'out',
                qty: deduction,
                reference_type: 'sales',
                reference_id: trxId
              }]);
            }
          }
        }
      }
    }
  }

  // FASE 3: Auto-Journaling (Jika langsung lunas)
  if (paymentStatus === 'paid') {
    const { data: journal } = await supabase.from('journals').insert([{
      reference: trxId,
      description: `Penjualan POS via ${body.paymentMethod || 'Tunai'}`
    }]).select('id').single();

    if (journal) {
      const isTunai = body.paymentMethod === 'Tunai';
      const debitAccount = isTunai ? 'Kas' : `${body.paymentMethod} Clearing`;
      
      await supabase.from('journal_lines').insert([
        { journal_id: journal.id, account_name: debitAccount, debit: body.total, credit: 0 },
        { journal_id: journal.id, account_name: 'Sales', debit: 0, credit: body.total }
      ]);
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

app.put('/api/transactions/:id/confirm-payment', async (req, res) => {
  const { id } = req.params;
  const { cashReceived, change, paymentMethod, cashierName } = req.body;

  // 1. Update status transaksi di Supabase
  const { data: trx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const updateData = {
    payment_status: 'paid',
    kds_status: 'new',
    paid_at: new Date().toISOString(),
    cashier_name: cashierName || 'Kasir',
    cash_received: cashReceived,
    change: change,
    payment_method: paymentMethod
  };

  const { error: updateErr } = await supabase.from('transactions').update(updateData).eq('id', id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // 2. AMBIL ITEM TRANSAKSI UNTUK POTONG STOK
  const { data: items } = await supabase.from('transaction_items').select('*, menu(*)').eq('transaction_id', id);

  if (items && items.length > 0) {
    for (const item of items) {
      // Cari resep (BOM)
      const { data: boms } = await supabase.from('menu_bom').select('bahan_id, qty').eq('menu_id', item.menu_id);

      if (boms && boms.length > 0) {
        for (const bom of boms) {
          // Cari info bahan
          const { data: masterBahan } = await supabase.from('bahan').select('name, unit').eq('id', bom.bahan_id).single();
          if (!masterBahan) continue;

          // Lokasi Produksi (Bar/Kitchen)
          const targetLocation = item.menu.category === 'Makanan' ? 'Kitchen' : 'Bar';

          const { data: prodBahan } = await supabase.from('bahan')
            .select('id, stock, unit')
            .eq('name', masterBahan.name)
            .eq('location', targetLocation)
            .single();

          if (prodBahan) {
            let ratio = 1;
            const u = (prodBahan.unit || '').toLowerCase();
            if (['kg', 'kilogram', 'liter', 'l'].includes(u)) ratio = 1000;

            const deduction = (Number(bom.qty) / ratio) * item.qty;
            await supabase.from('bahan').update({ stock: Number(prodBahan.stock) - deduction }).eq('id', prodBahan.id);

            // FASE 3: Event-Based Movement
            await supabase.from('stock_movements').insert([{
              product_id: prodBahan.id,
              type: 'out',
              qty: deduction,
              reference_type: 'sales',
              reference_id: id
            }]);
          }
        }
      }
    }
  }

  // 3. FASE 3: Auto-Journaling saat Konfirmasi Pembayaran
  const actualPaymentMethod = paymentMethod || trx.payment_method || 'Tunai';
  const { data: journal } = await supabase.from('journals').insert([{
    reference: id,
    description: `Pelunasan Transaksi via ${actualPaymentMethod}`
  }]).select('id').single();

  if (journal) {
    const debitAccount = actualPaymentMethod === 'Tunai' ? 'Kas' : `${actualPaymentMethod} Clearing`;
    await supabase.from('journal_lines').insert([
      { journal_id: journal.id, account_name: debitAccount, debit: trx.total, credit: 0 },
      { journal_id: journal.id, account_name: 'Sales', debit: 0, credit: trx.total }
    ]);
  }

  res.json({ ok: true, ...updateData });
});

// FASE 6: BR-003 Void Transaksi & Approval
app.post('/api/transactions/:id/request-void', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Audit Log: Request Void
  await supabase.from('audit_logs').insert([{
    action_type: 'REQUEST_VOID',
    table_name: 'transactions',
    description: `Kasir meminta VOID untuk transaksi ${id}. Alasan: ${reason}`,
    user_name: req.headers['x-user-role'] || 'Kasir'
  }]);

  await supabase.from('transactions').update({ payment_status: 'pending_void_approval' }).eq('id', id);
  res.json({ ok: true, message: 'Permintaan Void dikirim ke Manager' });
});

app.post('/api/transactions/:id/approve-void', async (req, res) => {
  const { id } = req.params;
  if (req.userContext?.role !== 'manager' && req.userContext?.role !== 'owner' && req.userContext?.role !== 'superadmin') {
    return res.status(403).json({ error: 'RBAC: Hanya Manager/Owner yang dapat menyetujui VOID' });
  }

  // Ambil transaksi lama untuk audit
  const { data: oldTx } = await supabase.from('transactions').select('*').eq('id', id).single();

  // Audit Log: Approve Void dengan JSONB
  await supabase.from('audit_logs').insert([{
    action_type: 'APPROVE_VOID',
    table_name: 'transactions',
    description: `Manager menyetujui VOID untuk transaksi ${id}.`,
    user_name: req.headers['x-user-role'],
    old_value: oldTx,
    new_value: { ...oldTx, payment_status: 'void' }
  }]);

  // Jurnal Balik (Reversal) untuk Void
  const { data: journal } = await supabase.from('journals').insert([{
    reference: `VOID-${id}`,
    description: `Reversal Jurnal Void Transaksi ${id}`
  }]).select('id').single();

  if (journal && oldTx) {
    const debitAccount = oldTx.payment_method === 'Tunai' ? 'Kas' : `${oldTx.payment_method} Clearing`;
    await supabase.from('journal_lines').insert([
      { journal_id: journal.id, account_name: 'Sales', debit: oldTx.total, credit: 0 },
      { journal_id: journal.id, account_name: debitAccount, debit: 0, credit: oldTx.total }
    ]);
  }

  await supabase.from('transactions').update({ payment_status: 'void' }).eq('id', id);
  res.json({ ok: true });
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
app.get('/api/suppliers', async (req, res) => {
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post('/api/suppliers', async (req, res) => {
  const { data, error } = await supabase.from('suppliers').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});
app.put('/api/suppliers/:id', async (req, res) => {
  const { error } = await supabase.from('suppliers').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.delete('/api/suppliers/:id', async (req, res) => {
  const { error } = await supabase.from('suppliers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ---- PURCHASE ORDERS ----
app.get('/api/po', async (req, res) => {
  // Fetch POs with their items
  const { data: pos, error } = await supabase.from('pembelian').select('*, items:pembelian_items(*)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  
  // Transform to match frontend expectation (mapping po_number to poNumber, etc.)
  const result = pos.map(p => ({
    ...p,
    poNumber: p.po_number,
    supplierId: p.supplier_id,
    createdAt: p.created_at,
    items: (p.items || []).map(i => ({
      ...i,
      bahanId: i.bahan_id,
      qty: i.qty_ordered,
      receivedQty: i.qty_received,
      price: i.price_at_order
    }))
  }));
  res.json(result);
});

app.post('/api/po', async (req, res) => {
  const { supplierId, location, items } = req.body;
  
  // 1. Generate PO Number
  const { count } = await supabase.from('pembelian').select('*', { count: 'exact', head: true });
  const poNum = 'PO-' + String((count || 0) + 1).padStart(4, '0');
  
  const totalAmount = items.reduce((sum, i) => sum + (Number(i.qty) * Number(i.price)), 0);

  // FASE 4: BR-012 PO Approval Limit
  const initialStatus = totalAmount > 5000000 ? 'Pending Approval' : 'Pending';

  // 2. Insert Header
  const { data: po, error: poErr } = await supabase.from('pembelian').insert([{
    po_number: poNum,
    supplier_id: Number(supplierId),
    location: location,
    status: initialStatus,
    total_amount: totalAmount
  }]).select().single();

  if (poErr) return res.status(500).json({ error: poErr.message });

  // FASE 4: Audit Trail Pembuatan PO
  await supabase.from('audit_logs').insert([{
    action_type: 'CREATE_PO',
    description: `PO ${poNum} dibuat dengan total ${totalAmount}. Status: ${initialStatus}`,
    user_name: req.body.createdBy || 'System'
  }]);

  // 3. Insert Items
  const itemsToInsert = items.map(i => ({
    pembelian_id: po.id,
    bahan_id: Number(i.bahanId),
    qty_ordered: Number(i.qty),
    qty_received: 0,
    price_at_order: Number(i.price)
  }));
  
  const { error: itemsErr } = await supabase.from('pembelian_items').insert(itemsToInsert);
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  res.json(po);
});

// FASE 6: BR-012 PO Approval 
app.post('/api/po/:id/approve', async (req, res) => {
  const { id } = req.params;
  if (req.userContext?.role !== 'manager' && req.userContext?.role !== 'owner' && req.userContext?.role !== 'superadmin') {
    return res.status(403).json({ error: 'RBAC: Hanya Manager/Owner yang dapat menyetujui PO' });
  }

  const { data: po } = await supabase.from('pembelian').select('*').eq('id', id).single();

  await supabase.from('audit_logs').insert([{
    action_type: 'APPROVE_PO',
    table_name: 'pembelian',
    description: `Manager menyetujui PO ${po?.po_number || id} senilai ${po?.total_amount}.`,
    user_name: req.headers['x-user-role'],
    old_value: po,
    new_value: { ...po, status: 'Pending' }
  }]);

  await supabase.from('pembelian').update({ status: 'Pending' }).eq('id', id);
  res.json({ ok: true });
});

app.put('/api/po/:id', async (req, res) => {
  const poId = req.params.id;
  const { status, items: updatedItems } = req.body;

  // 1. Get existing PO
  const { data: po, error: poErr } = await supabase.from('pembelian').select('*').eq('id', poId).single();
  if (poErr || !po) return res.status(404).json({ error: 'PO tidak ditemukan' });

  // 2. If status becomes 'Diterima', update inventory
  if (status === 'Diterima' && po.status !== 'Diterima') {
    if (updatedItems && Array.isArray(updatedItems)) {
      for (const item of updatedItems) {
        // a. Update qty_received in PO Items
        await supabase.from('pembelian_items')
          .update({ qty_received: Number(item.receivedQty) })
          .eq('pembelian_id', poId)
          .eq('bahan_id', item.bahanId);

        // b. Update STOCK in Bahan table
        const targetLoc = po.location || 'Gudang Utama';
        
        // Cari bahan di lokasi tersebut
        const { data: masterBahan } = await supabase.from('bahan').select('name, unit').eq('id', item.bahanId).single();
        if (!masterBahan) continue;

        const { data: existingBahan } = await supabase.from('bahan')
          .select('id, stock')
          .eq('name', masterBahan.name)
          .eq('location', targetLoc)
          .single();

        let targetBahanId = item.bahanId;
        if (existingBahan) {
          targetBahanId = existingBahan.id;
          // Update stok yang sudah ada
          await supabase.from('bahan')
            .update({ stock: Number(existingBahan.stock) + Number(item.receivedQty) })
            .eq('id', existingBahan.id);
        } else {
          // Buat record baru untuk lokasi ini
          const { data: masterFull } = await supabase.from('bahan').select('*').eq('id', item.bahanId).single();
          const { id, created_at, ...newBahanData } = masterFull;
          const { data: newBahan } = await supabase.from('bahan').insert([{
            ...newBahanData,
            stock: Number(item.receivedQty),
            location: targetLoc
          }]).select().single();
          if (newBahan) targetBahanId = newBahan.id;
        }

        // FASE 4: Event-Based Movement (Purchasing IN)
        await supabase.from('stock_movements').insert([{
          product_id: targetBahanId,
          type: 'in',
          qty: Number(item.receivedQty),
          reference_type: 'purchase',
          reference_id: poId
        }]);
      }

      // FASE 4: Auto-Journaling Purchasing (Hutang & Persediaan)
      const { data: journal } = await supabase.from('journals').insert([{
        reference: po.po_number,
        description: `Penerimaan Barang (GRN) dari PO ${po.po_number}`
      }]).select('id').single();

      if (journal) {
        await supabase.from('journal_lines').insert([
          { journal_id: journal.id, account_name: 'Inventory', debit: po.total_amount, credit: 0 },
          { journal_id: journal.id, account_name: 'Accounts Payable', debit: 0, credit: po.total_amount }
        ]);
      }
    }
  }

  // 3. Update PO Status
  const { error: updateErr } = await supabase.from('pembelian').update({ status }).eq('id', poId);
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // FASE 4: Audit Trail Perubahan Status PO
  await supabase.from('audit_logs').insert([{
    action_type: 'UPDATE_PO_STATUS',
    description: `PO ${po.po_number} diubah statusnya dari ${po.status} menjadi ${status}`,
    user_name: req.body.updatedBy || 'System'
  }]);

  res.json({ ok: true });
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

// ---- FASE 5: ANALITIK (Stateless Analytics API) ----
app.get('/api/v1/analytics/sales', async (req, res) => {
  const { period = 'month' } = req.query;
  const { start, end } = getDateRange(period);

  // 1. Menu Engineering (Stars, Puzzles, Plow Horses, Dogs)
  const { data: trxItems, error } = await supabase
    .from('transaction_items')
    .select('menu_id, qty, price, transactions!inner(created_at, payment_status)')
    .gte('transactions.created_at', start.toISOString())
    .lt('transactions.created_at', end.toISOString())
    .eq('transactions.payment_status', 'paid');

  if (error) return res.status(500).json({ error: error.message });

  const agg = {};
  trxItems.forEach(item => {
    if (!agg[item.menu_id]) agg[item.menu_id] = { qty: 0, revenue: 0 };
    agg[item.menu_id].qty += Number(item.qty);
    agg[item.menu_id].revenue += (Number(item.price) * Number(item.qty));
  });

  const { data: menus } = await supabase.from('menu').select('id, name, cost');
  let totalQty = 0; let totalProfit = 0;
  const matrix = Object.keys(agg).map(menuId => {
    const stat = agg[menuId];
    const m = menus.find(x => x.id === Number(menuId)) || {};
    const cost = Number(m.cost || 0);
    const profit = stat.revenue - (cost * stat.qty);
    totalQty += stat.qty;
    totalProfit += profit;
    return { name: m.name || 'Unknown', qty: stat.qty, profit };
  });

  const avgQty = matrix.length > 0 ? totalQty / matrix.length : 0;
  const avgProfit = matrix.length > 0 ? totalProfit / matrix.length : 0;

  const engineered = matrix.map(m => {
    let category = 'Dogs';
    if (m.qty >= avgQty && m.profit >= avgProfit) category = 'Stars';
    else if (m.qty < avgQty && m.profit >= avgProfit) category = 'Puzzles';
    else if (m.qty >= avgQty && m.profit < avgProfit) category = 'Plow Horses';
    return { ...m, category };
  });

  res.json({ menu_engineering: engineered });
});

app.get('/api/v1/analytics/financial', async (req, res) => {
  const { period = 'month' } = req.query;
  const { start, end } = getDateRange(period);

  const { data: lines, error } = await supabase
    .from('journal_lines')
    .select('account_name, debit, credit, journals!inner(created_at)')
    .gte('journals.created_at', start.toISOString())
    .lt('journals.created_at', end.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  let revenue = 0; let expense = 0; let cash = 0;
  lines.forEach(line => {
    const acc = line.account_name.toLowerCase();
    if (acc.includes('sales') || acc.includes('revenue')) revenue += Number(line.credit);
    if (acc.includes('cogs') || acc.includes('expense')) expense += Number(line.debit);
    if (acc === 'kas') cash += (Number(line.debit) - Number(line.credit));
  });

  res.json({ pnl: { revenue, expense, net_profit: revenue - expense }, cash_flow: { net_kas: cash } });
});

app.get('/api/v1/analytics/inventory', async (req, res) => {
  const { period = 'month' } = req.query;
  const { start, end } = getDateRange(period);

  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('type, qty, product_id, reference_type, created_at')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  let totalIn = 0; let totalOut = 0; let totalWaste = 0;
  movements.forEach(m => {
    if (m.type === 'in') totalIn += Number(m.qty);
    if (m.type === 'out' && m.reference_type === 'sales') totalOut += Number(m.qty);
    if (m.type === 'waste' || m.reference_type === 'waste') totalWaste += Number(m.qty);
  });

  const turnover_ratio = totalIn > 0 ? (totalOut / totalIn).toFixed(2) : 0;

  res.json({ turnover_ratio, total_in: totalIn, total_out: totalOut, total_waste: totalWaste });
});

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
  const periodLabel = period === 'today' ? `Tanggal : ${start.toLocaleDateString('id-ID')}` : `Periode : ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime() - 1).toLocaleDateString('id-ID')}`;

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
      memberSales: memberTrx.reduce((s, t) => s + (t.total || 0), 0),
      guestSales: guestTrx.reduce((s, t) => s + (t.total || 0), 0),
      payment: { cash, cashless, total: totalRevenue, selisih: 0 },
      byMethod: Object.entries(byMethod).map(([name, amount]) => ({ name, amount }))
    });
  }

  if (type === 'penjualan-periode') {
    const byDay = {};
    trx.forEach(t => {
      const d = new Date(t.createdAt || t.paidAt).toLocaleDateString('id-ID');
      byDay[d] = (byDay[d] || 0) + (t.total || 0);
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
    const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
    const wasteRatio = totalRevenue > 0 ? ((totalWaste / totalRevenue) * 100).toFixed(2) : 0;
    const categories = {};
    wasteItems.forEach(w => { categories[w.category || 'Lainnya'] = (categories[w.category || 'Lainnya'] || 0) + (w.amount || 0); });
    return res.json({ meta, type, title: 'Laporan Waste (Kerugian)', summary: { totalWaste, wasteRatio, status: wasteRatio > 3 ? 'PERLU PERHATIAN' : 'Normal', totalRevenue }, items: wasteItems, categories: Object.entries(categories).map(([name, amount]) => ({ name, amount })) });
  }

  if (type === 'hpp') {
    const products = {};
    trx.forEach(t => (t.items || []).forEach(item => {
      const m = db.menu.find(x => x.id === item.id);
      if (!m) return;
      const k = item.id;
      if (!products[k]) products[k] = { name: item.name, unit: m.unit || 'Pcs', stokAwal: 0, pembelian: 0, stokAkhir: 0, terpakai: 0, hargaSatuan: m.cost || 0, totalHPP: 0 };
      products[k].terpakai += item.qty || 1;
      products[k].totalHPP += (m.cost || 0) * (item.qty || 1);
    }));
    const rows = Object.values(products);
    const foodCostPct = totalRevenue > 0 ? ((totalHPP / totalRevenue) * 100).toFixed(2) : 0;
    return res.json({ meta, type, title: 'Laporan HPP (COGS)', rows, summary: { totalRevenue, totalHPP, foodCostPct } });
  }

  if (type === 'laba-rugi') {
    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
    const opEx = { gaji: 0, sewa: 0, utilitas: 0, lainnya: 0 };
    const totalOpEx = Object.values(opEx).reduce((s, v) => s + v, 0);
    const labaKotor = totalRevenue - totalHPP;
    const labaBersih = labaKotor - totalOpEx - totalWaste;
    return res.json({ meta, type, title: 'Laporan Laba Rugi', pendapatan: { penjualanNetto: totalRevenue, total: totalRevenue }, hpp: totalHPP, labaKotor, opEx, totalOpEx, waste: totalWaste, labaBersih, marginPct: totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(1) : 0 });
  }

  if (type === 'owner-dashboard') {
    const products = {};
    trx.forEach(t => (t.items || []).forEach(item => {
      if (!products[item.id]) products[item.id] = { name: item.name, icon: item.icon || '☕', qty: 0, revenue: 0 };
      products[item.id].qty += item.qty || 1;
      products[item.id].revenue += (item.price || 0) * (item.qty || 1);
    }));
    const bestSellers = Object.values(products).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
    const labaKotor = totalRevenue - totalHPP;
    const marginPct = totalRevenue > 0 ? ((labaKotor / totalRevenue) * 100).toFixed(1) : 0;
    const hours = {};
    trx.forEach(t => { const h = new Date(t.createdAt || t.paidAt).getHours(); hours[h] = (hours[h] || 0) + (t.total || 0); });
    const trendJam = Array.from({ length: 24 }, (_, i) => ({ hour: i, value: hours[i] || 0 }));
    return res.json({ meta, type, title: 'Dashboard Ringkasan Owner', kpi: { totalRevenue, totalHPP, totalWaste, labaKotor, marginPct, totalTrx: trx.length }, bestSellers, trendJam });
  }

  if (type === 'stok-opname') {
    const items = db.bahan.map(b => {
      const fisik = b.stock; // In real system, physical count would differ
      const sistem = b.stock;
      const selisih = fisik - sistem;
      const selisihPct = sistem > 0 ? ((selisih / sistem) * 100).toFixed(2) : 0;
      return { ...b, fisik, sistem, selisih, selisihPct };
    });
    const totalSelisih = items.reduce((s, b) => s + (b.selisih * b.price), 0);
    const itemSelisih = items.filter(b => b.selisih !== 0).length;
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
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
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
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime() - 1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Waktu', 'ID Transaksi', 'Pelanggan', 'Metode Pembayaran', 'Total (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });

    let rIdx = 5;
    trx.forEach((t, i) => {
      const row = sheet.insertRow(rIdx++, [
        i + 1, new Date(t.createdAt || t.paidAt).toLocaleString('id-ID'), t.id,
        t.customerName || 'Tamu', t.paymentMethod || 'Cash', t.total || 0
      ]);
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['', '', '', '', 'TOTAL PENJUALAN', totalRevenue]);
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
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });

    let rIdx = 5;
    db.bahan.forEach((b, i) => {
      const ratio = b.minStock > 0 ? b.stock / b.minStock : 2;
      const status = b.stock === 0 ? 'Habis' : ratio < 0.5 ? 'Kritis' : ratio < 1 ? 'Rendah' : 'Aman';
      const row = sheet.insertRow(rIdx++, [i + 1, b.name, b.unit, b.stock, b.minStock, status]);
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
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime() - 1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Nama Bahan', 'Alasan', 'Jumlah', 'Satuan', 'Nilai Kerugian (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });

    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);

    let rIdx = 5;
    wasteItems.forEach((w, i) => {
      const row = sheet.insertRow(rIdx++, [i + 1, w.bahanName || '-', w.category || 'Lainnya', w.qty || 1, w.unit || '-', w.amount || 0]);
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['', '', '', '', 'TOTAL WASTE', totalWaste]);
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
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime() - 1).toLocaleDateString('id-ID')}`]);
    sheet.mergeCells('A2:F2');
    sheet.insertRow(3, []);

    const headerRow = sheet.getRow(4);
    headerRow.values = ['No', 'Nama Bahan', 'Satuan', 'Terpakai', 'Harga Satuan (Rp)', 'Total HPP (Rp)'];
    headerRow.font = headerFont;
    headerRow.alignment = alignCenter;
    headerRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });

    const products = {};
    trx.forEach(t => (t.items || []).forEach(item => {
      const m = db.menu.find(x => x.id === item.id);
      if (!m) return;
      if (!products[item.id]) products[item.id] = { name: item.name, unit: m.unit || 'Pcs', terpakai: 0, hargaSatuan: m.cost || 0, totalHPP: 0 };
      products[item.id].terpakai += item.qty || 1;
      products[item.id].totalHPP += (m.cost || 0) * (item.qty || 1);
    }));

    let rIdx = 5;
    Object.values(products).forEach((p, i) => {
      const row = sheet.insertRow(rIdx++, [i + 1, p.name, p.unit, p.terpakai, p.hargaSatuan, p.totalHPP]);
      row.getCell(5).numFmt = currencyFmt;
      row.getCell(6).numFmt = currencyFmt;
      row.eachCell(c => c.border = borderAll);
    });

    const totalRow = sheet.insertRow(rIdx, ['', '', '', '', 'TOTAL HPP', totalHPP]);
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
    sheet.insertRow(2, [`Periode: ${start.toLocaleDateString('id-ID')} - ${new Date(end.getTime() - 1).toLocaleDateString('id-ID')}`]);
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
      totalRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; });
      sheet.insertRow(rIdx++, []);
    };

    const wasteItems = (db.waste || []).filter(w => { const d = new Date(w.date); return d >= start && d < end; });
    const totalWaste = wasteItems.reduce((s, w) => s + (w.amount || 0), 0);
    const labaKotor = totalRevenue - totalHPP;
    const labaBersih = labaKotor - totalWaste; // Assuming 0 opEx for now since it's not fully stored in DB

    addSection('PENDAPATAN', [{ label: 'Penjualan Netto', val: totalRevenue }], 'TOTAL PENDAPATAN', totalRevenue);
    addSection('HARGA POKOK PENJUALAN (HPP)', [{ label: 'Total HPP', val: totalHPP }], 'LABA KOTOR', labaKotor, false);

    // Add Laba Kotor row separately to be positive
    sheet.getRow(rIdx - 2).getCell(2).value = labaKotor; // Fix the negative calculation for Laba Kotor

    addSection('BIAYA & LOSS', [{ label: 'Waste / Loss', val: totalWaste }], 'TOTAL BIAYA', totalWaste, true);

    const netRow = sheet.insertRow(rIdx++, ['LABA BERSIH', labaBersih]);
    netRow.font = { ...titleFont, color: { argb: 'FFFFFFFF' } };
    netRow.eachCell(c => { c.border = borderAll; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }; });
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
      ? `laporan-semua-${start.toISOString().slice(0, 10)}.xlsx`
      : `laporan-${type}-${start.toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Gagal membuat file Excel' });
  }
});

// --- SUPERADMIN: TENANT MANAGEMENT ---
app.get('/api/tenants', async (req, res) => {
  // Idealnya cek is_superadmin di sini, tapi untuk demo kita buka dulu
  const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/updatetenant', async (req, res) => {
  const { id, ...updateData } = req.body;
  const { error } = await supabase.from('tenants').update(updateData).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
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
