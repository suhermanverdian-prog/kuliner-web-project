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
const DB_MODE = process.env.DB_MODE || (process.env.VERCEL ? 'cloud' : 'local'); // Auto-cloud on Vercel
const SUPABASE_SYNC_ENABLED = true;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ---- FASE 8: FEATURE FLAG SYSTEM (Backend Parity) ----
const TIER_DEFAULTS = {
  lite: { pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true, recipe_bom: false, waste_management: false, procurement: false, reporting_pdf: true, reporting_excel: false, crm: false, loyalty: false, accounting: false, multi_outlet: false, hq_dashboard: false, stock_transfer: false, white_label: false, api_access: false, ai_insights: false },
  pro: { pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true, recipe_bom: true, waste_management: true, procurement: true, reporting_pdf: true, reporting_excel: true, crm: true, loyalty: true, accounting: false, multi_outlet: false, hq_dashboard: false, stock_transfer: false, white_label: false, api_access: false, ai_insights: false },
  enterprise: { pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true, recipe_bom: true, waste_management: true, procurement: true, reporting_pdf: true, reporting_excel: true, crm: true, loyalty: true, accounting: true, multi_outlet: true, hq_dashboard: true, stock_transfer: true, white_label: true, api_access: true, ai_insights: true }
};

const resolveFeatures = (tenant) => {
  if (!tenant) return TIER_DEFAULTS.lite;
  const defaults = TIER_DEFAULTS[tenant.tier] || TIER_DEFAULTS.lite;
  const overrides = tenant.feature_overrides || {};
  const resolved = {};
  Object.keys(TIER_DEFAULTS.enterprise).forEach(key => {
    resolved[key] = (key in overrides) ? overrides[key] : (defaults[key] ?? false);
  });
  return resolved;
};

// ---- FASE 6: RBAC & Tenant Isolation Middleware ----
const rbacMiddleware = async (req, res, next) => {
  const role = req.headers['x-user-role'] || 'guest';
  const tenantId = req.headers['x-tenant-id'] || null;

  // Bebaskan endpoint public
  if (req.path.includes('/login') || req.path.includes('/uploads') || req.path.includes('/health')) return next();

  // BR-020: Isolasi Tenant (Inject ke req object)
  req.userContext = { role, tenantId };

  // 1. Validasi Sederhana RBAC
  if (role === 'kasir' && req.method === 'DELETE') {
    return res.status(403).json({ error: 'RBAC: Role Kasir tidak diizinkan menghapus data.' });
  }

  // 2. Feature Flag Protection (Meticulous Check)
  if (tenantId && role !== 'superadmin') {
    // Cari tenant di local dulu, lalu supabase
    const db = readDB();
    let tenant = (db.tenants || []).find(t => String(t.id) === String(tenantId));
    
    if (!tenant) {
      const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      tenant = data;
    }

    if (tenant) {
      const features = resolveFeatures(tenant);
      
      // Map routes to features
      const path = req.path.toLowerCase();
      if (path.includes('/po') || path.includes('/grn') || path.includes('/purchase_invoices') || path.includes('/purchase_payments') || path.includes('/suppliers')) {
        if (!features.procurement) return res.status(403).json({ error: 'Fitur Pengadaan (Procurement) tidak aktif di paket Anda. Upgrade ke Pro atau Enterprise.' });
      }
      if (path.includes('/accounting') || path.includes('/journals') || path.includes('/accounts')) {
        if (!features.accounting) return res.status(403).json({ error: 'Fitur Akuntansi (Full Ledger) tidak aktif di paket Anda. Upgrade ke Enterprise.' });
      }
      if (path.includes('/analytics') || path.includes('/laporan')) {
        if (!features.reporting_pdf && !features.reporting_excel) {
           return res.status(403).json({ error: 'Fitur Laporan & Analitik tidak aktif di paket Anda.' });
        }
      }
    }
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

// ---- Default Chart of Accounts ----
const DEFAULT_ACCOUNTS = [
  { code: '1-1000', name: 'Kas & Bank',              category: 'Aset',       normalBalance: 'debit'  },
  { code: '1-2000', name: 'Persediaan Bahan Baku',   category: 'Aset',       normalBalance: 'debit'  },
  { code: '1-3000', name: 'Piutang Usaha',           category: 'Aset',       normalBalance: 'debit'  },
  { code: '2-1000', name: 'Hutang Dagang',           category: 'Liabilitas', normalBalance: 'credit' },
  { code: '2-2000', name: 'Hutang Pajak',            category: 'Liabilitas', normalBalance: 'credit' },
  { code: '3-1000', name: 'Modal Owner',             category: 'Ekuitas',    normalBalance: 'credit' },
  { code: '4-1000', name: 'Pendapatan Penjualan',    category: 'Pendapatan', normalBalance: 'credit' },
  { code: '5-1000', name: 'Harga Pokok Penjualan',   category: 'Beban',      normalBalance: 'debit'  },
  { code: '6-1000', name: 'Biaya Operasional',       category: 'Beban',      normalBalance: 'debit'  },
  { code: '6-2000', name: 'Biaya Waste & Susut',     category: 'Beban',      normalBalance: 'debit'  },
];

// ---- Simple JSON "Database" ----
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) return initDB();
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (!data.suppliers) data.suppliers = [];
    if (!data.purchase_orders) data.purchase_orders = [];
    if (!data.shifts) data.shifts = [];
    if (!data.transactions) data.transactions = [];
    if (!data.inventory_meta) data.inventory_meta = { categories: [], packageUnits: [], itemUnits: [] };
    // Accounting tables
    if (!data.accounts)       data.accounts = DEFAULT_ACCOUNTS;
    if (!data.journals)       data.journals = [];
    if (!data.journal_lines)  data.journal_lines = [];
    if (!data.grns)           data.grns = [];
    if (!data.purchase_invoices)  data.purchase_invoices = [];
    if (!data.purchase_payments)  data.purchase_payments = [];
    return data;
  }
  catch { return initDB(); }
};

const writeDB = (data) => {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('⚠️ Gagal menyimpan ke data.json (Vercel bersifat read-only). Mengabaikan perubahan.');
  }
};

// --- CLOUD FETCH HELPERS (FASE 3) ---
const fetchFromCloud = async (table, tenantId, outletId = null) => {
  let query = supabase.from(table).select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  if (outletId) query = query.eq('outlet_id', outletId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const saveToCloud = async (table, data) => {
  const { data: result, error } = await supabase.from(table).upsert([data]).select();
  if (error) throw error;
  return result[0];
};

// ---- OUTLETS (FASE 4) ----
app.get('/api/outlets', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  if (DB_MODE === 'cloud') {
    try {
      const data = await fetchFromCloud('outlets', tenantId);
      return res.json(data);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  res.json(db.outlets || []);
});

app.post('/api/outlets', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  if (DB_MODE === 'cloud') {
    try {
      const saved = await saveToCloud('outlets', { ...req.body, tenant_id: tenantId });
      return res.json(saved);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  if (!db.outlets) db.outlets = [];
  const newOutlet = { ...req.body, id: Date.now() };
  db.outlets.push(newOutlet);
  writeDB(db);
  res.json(newOutlet);
});

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
    },
    // ---- Accounting Tables (seeded on fresh install) ----
    accounts:          DEFAULT_ACCOUNTS,
    journals:          [],
    journal_lines:     [],
    grns:              [],
    purchase_invoices: [],
    purchase_payments: [],
  };
  writeDB(initial);
  return initial;
};

// ---- FASE 7: FULL ACCOUNTING HELPER ----
// BR-016: Total Debit HARUS sama dengan Total Kredit
const createJournalLocal = (db, reference, description, lines, tenantId = null) => {
  const totalDebit  = lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`[BR-016] Jurnal tidak seimbang → Debit: ${totalDebit}, Kredit: ${totalCredit}`);
  }

  const journalId = `JRN-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
  const journalDate = new Date().toISOString();

  if (!db.journals)      db.journals      = [];
  if (!db.journal_lines) db.journal_lines  = [];

  const journal = { id: journalId, reference, description, date: journalDate, tenantId, totalDebit };
  db.journals.push(journal);

  lines.forEach(l => db.journal_lines.push({ ...l, journalId, date: journalDate }));

  // Background Supabase sync (fire-and-forget)
  supabase.from('journals').insert([{ id: journalId, reference, description, tenant_id: tenantId }])
    .then(() => supabase.from('journal_lines').insert(lines.map(l => ({ ...l, journal_id: journalId }))))
    .catch(e => console.warn('Journal Supabase sync failed:', e.message));

  return journal;
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
    if (DB_MODE === 'cloud') {
      console.log(`🔐 Attempting Cloud Login for: ${username} (Role: ${role})`);
      const { data, error } = await supabase
        .from('users')
        .select('*, tenant:tenants(*)')
        .ilike('username', username) // Use ilike for case-insensitive
        .eq('password', password)
        .single();
      
      if (error) console.error('❌ Supabase Auth Error:', error.message);
      user = data;
      if (user) console.log('✅ User found:', user.username, 'Role:', user.role);
    } else {
      // MODE LOKAL
      const db = readDB();
      user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      // Inject Enterprise Tier agar menu muncul di Lokal
      if (user && (user.role === 'admin' || user.role === 'owner') && !user.tenant) {
        user.tenant = { name: 'Local Dev Store', tier: 'enterprise' };
      }
    }
  }

  if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });

  const isSysAdmin = user.role === 'superadmin';

  // Check if tenant is active (if not superadmin)
  if (!isSysAdmin && user.tenant && !user.tenant.is_active) {
    return res.status(403).json({ error: 'Akun bisnis Anda sedang dinonaktifkan. Silakan hubungi SuperAdmin.' });
  }

  // Jika user adalah superadmin, pastikan role-nya diset benar
  if (isSysAdmin) {
    user.role = 'superadmin';
    user.is_superadmin = true; // Unlock all frontend features
  }

  const { password: _, ...safeUser } = user;
  res.json({ 
    user: safeUser, 
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
  try {
    const { data, error } = await supabase.from('menu').select('*').order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.warn('⚠️ Supabase menu error, falling back to empty list:', err.message);
    res.json([]);
  }
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
  if (DB_MODE === 'cloud') {
    try {
      const data = await fetchFromCloud('bahan', req.headers['x-tenant-id'], req.headers['x-outlet-id']);
      return res.json(data);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  res.json(db.bahan || []);
});
app.post('/api/bahan', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const saved = await saveToCloud('bahan', { ...req.body, tenant_id: req.headers['x-tenant-id'] });
      return res.json(saved);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  const { id } = req.body;
  
  if (id) {
    const idx = db.bahan.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
      db.bahan[idx] = { ...db.bahan[idx], ...req.body, id: Number(id) };
      writeDB(db);
      return res.json(db.bahan[idx]);
    }
  }

  const newBahan = { ...req.body, id: Date.now(), stock: Number(req.body.stock || 0) };
  db.bahan.push(newBahan);
  writeDB(db);
  res.json(newBahan);
});
app.put('/api/bahan/:id', (req, res) => {
  const db = readDB();
  const idx = db.bahan.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Bahan tidak ditemukan' });
  db.bahan[idx] = { ...db.bahan[idx], ...req.body };
  writeDB(db);
  res.json({ ok: true });
});
app.delete('/api/bahan/:id', (req, res) => {
  const db = readDB();
  db.bahan = (db.bahan || []).filter(b => b.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok: true });
});

// ---- PROCUREMENT (SUPPLIERS) ----
app.get('/api/suppliers', (req, res) => {
  const db = readDB();
  res.json(db.suppliers || []);
});

app.post('/api/suppliers', (req, res) => {
  const db = readDB();
  const { id } = req.body;
  if (id) {
    const idx = db.suppliers.findIndex(s => s.id === Number(id));
    if (idx !== -1) {
      db.suppliers[idx] = { ...db.suppliers[idx], ...req.body, id: Number(id) };
      writeDB(db);
      return res.json(db.suppliers[idx]);
    }
  }
  const newSupplier = { ...req.body, id: Date.now() };
  db.suppliers.push(newSupplier);
  writeDB(db);
  res.json(newSupplier);
});

app.delete('/api/suppliers/:id', (req, res) => {
  const db = readDB();
  db.suppliers = (db.suppliers || []).filter(s => s.id !== Number(req.params.id));
  writeDB(db);
  res.json({ ok: true });
});

// ---- PROCUREMENT (PURCHASE ORDERS) ----
app.get('/api/po', (req, res) => {
  const db = readDB();
  res.json(db.purchase_orders || []);
});

app.post('/api/po', (req, res) => {
  const db = readDB();
  const { id } = req.body;
  if (id) {
    const idx = db.purchase_orders.findIndex(p => p.id === Number(id));
    if (idx !== -1) {
      db.purchase_orders[idx] = { ...db.purchase_orders[idx], ...req.body, id: Number(id) };
      writeDB(db);
      return res.json(db.purchase_orders[idx]);
    }
  }
  const poNum = `PO-${Date.now()}`;
  const newPO = { 
    ...req.body, 
    id: Date.now(), 
    poNumber: poNum, 
    status: req.body.status || 'Pending',
    createdAt: new Date().toISOString()
  };
  db.purchase_orders.push(newPO);
  writeDB(db);
  res.json(newPO);
});

// Update PO Status & Inventory (Receiving)
app.put('/api/postatus/:id', (req, res) => {
  const db = readDB();
  const { status, receivedItems } = req.body;
  const poIdx = db.purchase_orders.findIndex(p => p.id === Number(req.params.id));
  
  if (poIdx === -1) return res.status(404).json({ error: 'PO tidak ditemukan' });

  const po = db.purchase_orders[poIdx];
  po.status = status;

  if (receivedItems && receivedItems.length > 0) {
    // Buat catatan GRN
    const grn = {
      id: Date.now(),
      poId: po.id,
      poNumber: po.poNumber,
      createdAt: new Date().toISOString(),
      items: receivedItems
    };
    db.grns.push(grn);

    // Update Stok + Hitung Nilai Pembelian
    let totalNilaiBeli = 0;
    receivedItems.forEach(item => {
      const bIdx = db.bahan.findIndex(b => b.id === Number(item.bahanId));
      if (bIdx !== -1) {
        const qtyToStore = Number(item.receivedQty || item.qty);
        const factor = Number(item.conversionFactor) || 1;
        const unitCost = Number(item.price) || 0;
        const totalCost = unitCost * qtyToStore;
        totalNilaiBeli += totalCost;
        db.bahan[bIdx].stock = (Number(db.bahan[bIdx].stock) || 0) + (qtyToStore * factor);
        // Update cost (FIFO sederhana: update dengan harga terbaru)
        if (unitCost > 0) db.bahan[bIdx].cost = unitCost;
      }
    });

    // JURNAL: Penerimaan Barang (Debit Persediaan, Kredit Hutang Dagang)
    if (totalNilaiBeli > 0) {
      try {
        createJournalLocal(db, po.poNumber, `Penerimaan Barang - ${po.poNumber}`, [
          { accountCode: '1-2000', accountName: 'Persediaan Bahan Baku', debit: totalNilaiBeli, credit: 0 },
          { accountCode: '2-1000', accountName: 'Hutang Dagang',         debit: 0, credit: totalNilaiBeli },
        ]);
      } catch (jErr) {
        console.error('⚠️ GRN journal failed (non-fatal):', jErr.message);
      }
    }
  }

  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/grns', (req, res) => {
  const db = readDB();
  res.json(db.grns || []);
});
// ---- PROCUREMENT (INVOICES & PAYMENTS) ----
app.get('/api/purchase_invoices', (req, res) => {
  const db = readDB();
  res.json(db.purchase_invoices || []);
});

app.post('/api/purchase_invoices', (req, res) => {
  const db = readDB();
  const newInvoice = {
    ...req.body,
    id: Date.now(),
    invoiceNumber: `INV-PUR-${Date.now()}`,
    status: 'unpaid',
    createdAt: new Date().toISOString()
  };
  db.purchase_invoices.push(newInvoice);
  writeDB(db);
  res.json(newInvoice);
});

app.get('/api/purchase_payments', (req, res) => {
  const db = readDB();
  res.json(db.purchase_payments || []);
});

app.post('/api/purchase_payments', (req, res) => {
  const db = readDB();
  const newPayment = {
    ...req.body,
    id: Date.now(),
    paymentNumber: `PAY-PUR-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  const amount = Number(req.body.amount) || 0;

  // Update invoice status if linked
  if (req.body.invoiceId) {
    const invIdx = db.purchase_invoices.findIndex(inv => inv.id === Number(req.body.invoiceId));
    if (invIdx !== -1) {
      db.purchase_invoices[invIdx].status = 'paid';
    }
  }

  // JURNAL: Pembayaran Hutang (Debit Hutang Dagang, Kredit Kas)
  if (amount > 0) {
    try {
      createJournalLocal(db, newPayment.paymentNumber, `Pembayaran Hutang - ${req.body.supplierName || 'Supplier'}`, [
        { accountCode: '2-1000', accountName: 'Hutang Dagang', debit: amount,  credit: 0 },
        { accountCode: '1-1000', accountName: 'Kas & Bank',    debit: 0, credit: amount },
      ]);
    } catch (jErr) {
      console.error('⚠️ Payment journal failed (non-fatal):', jErr.message);
    }
  }

  db.purchase_payments.push(newPayment);
  writeDB(db);
  res.json(newPayment);
});


// ---- TRANSAKSI ----
app.get('/api/transactions', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const data = await fetchFromCloud('transactions', req.headers['x-tenant-id'], req.headers['x-outlet-id']);
      return res.json(data);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  try {
    const db = readDB();
    const txs = db.transactions || [];
    // Ensure consistent structure
    const formatted = txs.map(t => ({
      ...t,
      id: t.id || `TRX-${Date.now()}`,
      kdsStatus: t.kdsStatus || t.kds_status || 'new',
      customerName: t.customerName || t.customer_name || 'Tamu',
      items: t.items || []
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const body = req.body;
    const db = readDB();
    
    // Generate ID unik
    const trxId = 'TRX-' + String((db.transactions?.length || 0) + 1).padStart(4, '0') + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    const isSelfOrder = body.cashierName === 'Self Service';
    const paymentStatus = isSelfOrder ? 'pending_payment' : 'paid';

    const trxData = {
      id: trxId,
      createdAt: new Date().toISOString(),
      total: Number(body.total || 0),
      subtotal: Number(body.subtotal || 0),
      taxAmount: Number(body.taxAmount || 0),
      discountAmount: Number(body.discountAmount || 0),
      paymentMethod: body.paymentMethod || 'Tunai',
      paymentStatus: paymentStatus,
      cashierName: body.cashierName || 'System',
      customerName: body.customerName || 'Tamu',
      tableType: body.tableType || 'Take Away',
      kdsStatus: 'new',
      items: body.items || []
    };

    // Simpan ke JSON DB (Utama)
    db.transactions = db.transactions || [];
    db.transactions.push(trxData);

    // --- LOGIKA POTONG STOK (Local) ---
    let totalHppSale = 0;
    if (!isSelfOrder && body.items) {
      for (const item of body.items) {
        const menuIdx = db.menu?.findIndex(m => m.id == item.id);
        if (menuIdx > -1) {
          const m = db.menu[menuIdx];
          if (m.bom) {
            m.bom.forEach(b => {
              const bIdx = db.bahan?.findIndex(bh => bh.id == b.bahanId);
              if (bIdx > -1) {
                const usedQty = Number(b.qty) * item.qty;
                const unitCost = db.bahan[bIdx].cost || 0;
                totalHppSale += usedQty * unitCost;
                db.bahan[bIdx].stock -= usedQty;
              }
            });
          }
        }
      }
    }

    // --- OTOMATISASI JURNAL AKUNTANSI (Double-Entry) ---
    // Hanya untuk transaksi yang sudah dibayar (bukan self-order pending)
    if (!isSelfOrder) {
      try {
        const journalLines = [
          // 1. Kas/Bank bertambah (Debit)
          { accountCode: '1-1000', accountName: 'Kas & Bank',            debit: trxData.total,    credit: 0 },
          // 2. Pendapatan Penjualan bertambah (Kredit)
          { accountCode: '4-1000', accountName: 'Pendapatan Penjualan',  debit: 0, credit: trxData.subtotal },
          // 3. Pajak terutang (Kredit)
          ...(trxData.taxAmount > 0 ? [{ accountCode: '2-2000', accountName: 'Hutang Pajak', debit: 0, credit: trxData.taxAmount }] : []),
          // 4. Diskon mengurangi pendapatan (Debit balik)
          ...(trxData.discountAmount > 0 ? [{ accountCode: '4-1000', accountName: 'Pendapatan Penjualan (Diskon)', debit: trxData.discountAmount, credit: 0 }] : []),
        ];

        // Hanya tambahkan HPP jika ada data BOM
        if (totalHppSale > 0) {
          journalLines.push({ accountCode: '5-1000', accountName: 'Harga Pokok Penjualan', debit: totalHppSale, credit: 0 });
          journalLines.push({ accountCode: '1-2000', accountName: 'Persediaan Bahan Baku',  debit: 0, credit: totalHppSale });
        }

        createJournalLocal(db, trxId, `Penjualan - ${trxData.customerName} - ${trxData.tableType}`, journalLines);
      } catch (jErr) {
        console.error('⚠️ Journal auto-entry failed (non-fatal):', jErr.message);
      }
    }

    writeDB(db);

    // Sync ke Supabase (Optional/Background)
    supabase.from('transactions').insert([{
      id: trxId,
      total: trxData.total,
      subtotal: trxData.subtotal,
      payment_method: trxData.paymentMethod,
      customer_name: trxData.customerName
    }]).then(() => {
      if (trxData.items.length > 0) {
        const itemsToInsert = trxData.items.map(i => ({
          transaction_id: trxId,
          menu_id: i.id,
          qty: i.qty,
          price: i.price
        })).filter(i => i.menu_id);
        supabase.from('transaction_items').insert(itemsToInsert).catch(e => console.error('Supabase Sync Items Error:', e));
      }
    }).catch(e => console.error('Supabase Sync Header Error:', e));

    res.json(trxData);
  } catch (err) {
    console.error('Checkout Error:', err);
    res.status(500).json({ error: 'Gagal memproses transaksi' });
  }
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
app.put('/api/transactions/:id/kds', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDB();
    
    const trx = db.transactions?.find(t => t.id === id);
    if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan di sistem lokal' });
    
    trx.kdsStatus = status;
    writeDB(db);
    
    // Optional: Sync to Supabase if you want, but skip kds_status since it doesn't exist
    
    res.json({ ok: true, status: trx.kdsStatus });
  } catch (err) {
    console.error('Update KDS Error:', err);
    res.status(500).json({ error: 'Gagal memperbarui status KDS' });
  }
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

// ---- SETTINGS ----
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error || !data) {
      // Fallback jika database kosong atau error
      return res.json({ 
        storeName: 'BrewMaster Coffee', 
        tax: 10, 
        serviceCharge: 5, 
        rewardEnabled: true,
        currency: 'IDR'
      });
    }
    res.json(data);
  } catch (err) {
    res.json({ storeName: 'BrewMaster Coffee', tax: 10, serviceCharge: 5 });
  }
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
          // Update stok yang sudah ada
          const actualQtyToAdd = Number(item.receivedQty) * (Number(item.conversionFactor) || 1);
          await supabase.from('bahan')
            .update({ stock: Number(existingBahan.stock) + actualQtyToAdd })
            .eq('id', existingBahan.id);
        } else {
          // Buat record baru untuk lokasi ini
          const { data: masterFull } = await supabase.from('bahan').select('*').eq('id', item.bahanId).single();
          const { id: oldId, created_at, ...newBahanData } = masterFull;
          const actualQtyToAdd = Number(item.receivedQty) * (Number(item.conversionFactor) || 1);
          const { data: newBahan } = await supabase.from('bahan').insert([{
            ...newBahanData,
            stock: actualQtyToAdd,
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

// ---- INVENTORY META (Kategori & Satuan) ----
app.get('/api/inventorymeta', (req, res) => {
  res.json({
    categories: ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'],
    packageUnits: ['Karton', 'Dus', 'Ball', 'Box', 'Pack', 'Jerigen'],
    itemUnits: ['Botol', 'Pcs', 'Gram', 'ML', 'Sachet', 'Kg', 'Liter', 'Butir']
  });
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
app.post('/api/stock-transfer', (req, res) => {
  const { bahanId, fromLocation, toLocation, qty } = req.body;
  const db = readDB();
  const quantity = Number(qty);

  const sourceIdx = db.bahan.findIndex(b => b.id === Number(bahanId));
  if (sourceIdx === -1) return res.status(404).json({ error: 'Bahan tidak ditemukan' });

  // Kurangi asal
  db.bahan[sourceIdx].stock -= quantity;

  // Tambah tujuan
  const targetIdx = db.bahan.findIndex(b => b.name === db.bahan[sourceIdx].name && b.location === toLocation);
  if (targetIdx !== -1) {
    db.bahan[targetIdx].stock += quantity;
  } else {
    const newItem = { ...db.bahan[sourceIdx], id: Date.now(), location: toLocation, stock: quantity };
    db.bahan.push(newItem);
  }

  writeDB(db);
  res.json({ ok: true });
});

// ---- INVENTORY AUDIT LOGS ----
app.post('/api/inventory/adjust', (req, res) => {
  const { bahanId, changeQty, type, reason, userName, nextStock } = req.body;
  const db = readDB();
  const idx = db.bahan.findIndex(b => b.id === Number(bahanId));
  if (idx === -1) return res.status(404).json({ error: 'Bahan tidak ditemukan' });

  const current = db.bahan[idx];
  const finalStock = nextStock !== undefined ? Number(nextStock) : (Number(current.stock) + Number(changeQty));
  
  const prevStock = current.stock;
  db.bahan[idx].stock = finalStock;

  if (!db.inventory_logs) db.inventory_logs = [];
  db.inventory_logs.push({
    id: Date.now(),
    bahan_id: bahanId,
    bahan_name: current.name,
    change_qty: finalStock - prevStock,
    prev_stock: prevStock,
    next_stock: finalStock,
    type,
    reason,
    user_name: userName || 'System',
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/inventory/logs', async (req, res) => {
  const { data, error } = await supabase.from('inventory_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---- SYSTEM ACTIVITY LOGS ----
app.post('/api/system-logs', async (req, res) => {
  const { userName, role, activityType, description } = req.body;
  const { error } = await supabase.from('system_logs').insert([{
    user_name: userName,
    role,
    activity_type: activityType,
    description,
    ip_address: req.ip
  }]);
  if (error) console.error('Failed to log activity:', error.message);
  res.json({ ok: true });
});

app.get('/api/system-logs', async (req, res) => {
  const { data, error } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---- KASIR SHIFTS ----
app.get('/api/shifts', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (DB_MODE === 'cloud') {
      let query = supabase.from('shifts').select('*').order('created_at', { ascending: false });
      if (tenantId) query = query.eq('tenant_id', tenantId);
      
      const { data, error } = await query;
      if (error) throw error;
      const formatted = (data || []).map(s => ({
        ...s,
        openTime: s.start_time,
        closeTime: s.end_time,
        startTime: s.start_time,
        endTime: s.end_time,
        openCash: s.open_cash,
        currentSales: s.current_sales,
        currentCash: s.current_cash,
        currentQris: s.current_qris,
        totalSales: s.total_sales,
        totalCash: s.total_cash,
        totalQris: s.total_qris,
        userName: s.user_name,
        kasir: s.user_name
      }));
      return res.json(formatted);
    }
    return res.json(readDB().shifts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shifts', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    
    if (DB_MODE === 'cloud') {
      const payload = { 
        tenant_id: tenantId,
        user_name: req.body.userName || req.body.kasir || 'Kasir',
        start_time: req.body.openTime || req.body.startTime || new Date().toISOString(),
        open_cash: req.body.openCash || 0,
        status: req.body.status || 'open'
      };
      
      // Auto-close open shifts for this tenant before creating a new one
      await supabase.from('shifts')
        .update({ status: 'closed', end_time: new Date().toISOString() })
        .eq('status', 'open')
        .eq('tenant_id', tenantId);

      const { data, error } = await supabase.from('shifts').insert([payload]).select();
      if (error) throw error;
      return res.json(data[0]);
    }
    
    const db = readDB();
    if (db.shifts) {
      db.shifts = db.shifts.map(s => s.status === 'open' ? { ...s, status: 'closed', endTime: new Date().toISOString() } : s);
    } else {
      db.shifts = [];
    }
    const shift = { ...req.body, id: Date.now(), status: 'open', startTime: new Date().toISOString() };
    db.shifts.push(shift); writeDB(db); res.json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (DB_MODE === 'cloud') {
      const payload = {};
      if (req.body.status) payload.status = req.body.status;
      if (req.body.closeTime || req.body.endTime) payload.end_time = req.body.closeTime || req.body.endTime;
      if (req.body.totalSales !== undefined) payload.total_sales = req.body.totalSales;
      if (req.body.totalCash !== undefined) payload.total_cash = req.body.totalCash;
      if (req.body.totalQris !== undefined) payload.total_qris = req.body.totalQris;

      const { data, error } = await supabase.from('shifts').update(payload).eq('id', id).select();
      if (error) throw error;
      return res.json(data[0] || { ok: true });
    }
    
    const db = readDB();
    if (!db.shifts) db.shifts = [];
    db.shifts = db.shifts.map(s => String(s.id) === String(id) ? { ...s, ...req.body, endTime: req.body.status === 'closed' ? new Date().toISOString() : s.endTime } : s);
    writeDB(db); res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  try {
    const { data: trx, error } = await supabase
      .from('transactions')
      .select('items, created_at')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .eq('payment_status', 'paid');
    if (error) throw error;
    const agg = {};
    trx.forEach(t => (t.items || []).forEach(it => {
      const key = it.id || it.name;
      if (!agg[key]) agg[key] = { name: it.name, qty: 0, revenue: 0 };
      agg[key].qty += Number(it.qty || 0);
      agg[key].revenue += (Number(it.price || 0) * Number(it.qty || 0));
    }));
    res.json({ matrix: Object.values(agg) });
  } catch (err) { res.status(500).json({ error: err.message }); }
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

// FASE 7: FULL ACCOUNTING REPORTS (Feature-Locked)
app.get('/api/v1/accounting/reports', async (req, res) => {
  const { period = 'month' } = req.query;
  const tenantId = req.headers['x-tenant-id'];

  // 1. Aktivasi Feature-Locked Accounting
  if (tenantId) {
    const { data: tenant } = await supabase.from('tenants').select('features').eq('id', tenantId).single();
    if (tenant && tenant.features && tenant.features.allow_accounting === false) {
      return res.status(403).json({ error: 'Fitur Akuntansi (Full Ledger) belum diaktifkan untuk paket Anda.' });
    }
  }

  const { start, end } = getDateRange(period);
  const { data: lines, error } = await supabase
    .from('journal_lines')
    .select('account_name, debit, credit, journals!inner(created_at)')
    .gte('journals.created_at', start.toISOString())
    .lt('journals.created_at', end.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  const balanceSheet = { Asset: 0, Liability: 0, Equity: 0 };
  const pnl = { Revenue: 0, Expense: 0 };
  const cashFlow = { Operating: 0 };

  lines.forEach(l => {
    const acc = (l.account_name || '').toLowerCase();
    const net = Number(l.debit) - Number(l.credit);
    
    // Klasifikasi Chart of Accounts (COA) Sederhana
    if (acc.includes('kas') || acc.includes('clearing') || acc.includes('inventory')) balanceSheet.Asset += net;
    else if (acc.includes('payable') || acc.includes('hutang') || acc.includes('grni')) balanceSheet.Liability -= net; 
    else if (acc.includes('sales') || acc.includes('revenue')) pnl.Revenue -= net; 
    else if (acc.includes('cogs') || acc.includes('expense') || acc.includes('waste')) pnl.Expense += net;

    // Cash flow khusus akun Kas Tunai
    if (acc === 'kas') cashFlow.Operating += net;
  });

  res.json({
    balance_sheet: balanceSheet,
    profit_and_loss: { ...pnl, NetProfit: (pnl.Revenue * -1) - pnl.Expense },
    cash_flow: cashFlow
  });
});

app.get('/api/v1/analytics/inventory', async (req, res) => {
  const { period = 'month' } = req.query;
  const { start, end } = getDateRange(period);
  try {
    const { data: movements, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
    if (error) throw error;
    let totalIn = 0; let totalOut = 0; let totalWaste = 0;
    (movements || []).forEach(m => {
      const q = Number(m.quantity || 0);
      if (m.type === 'adjustment' && q > 0) totalIn += q;
      else if (m.type === 'adjustment' && q < 0) totalOut += Math.abs(q);
      else if (m.type === 'transfer' && q < 0) totalOut += Math.abs(q);
      else if (m.type === 'waste') totalWaste += Math.abs(q);
    });
    res.json({ turnover_ratio: totalIn > 0 ? (totalOut / totalIn).toFixed(2) : 0, total_in: totalIn, total_out: totalOut, total_waste: totalWaste });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/laporan/summary', async (req, res) => {
  const { period = 'today' } = req.query;
  const { start, end } = getDateRange(period);
  const tenantId = req.headers['x-tenant-id'];
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .eq('payment_status', 'paid');
      
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data: trx, error } = await query;
    if (error) throw error;
    
    const safeTrx = trx || [];
    const totalRevenue = safeTrx.reduce((s, t) => s + Number(t.total || 0), 0);
    const totalTransactions = safeTrx.length;
    res.json({
      totalRevenue, totalTransactions,
      avgTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      totalHPP: totalRevenue * 0.3, grossProfit: totalRevenue * 0.7,
      marginPct: 70
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    
    // PROCUREMENT DATA (NEW)
    const periodPOs = (db.purchase_orders || []).filter(p => {
      const d = new Date(p.createdAt);
      return d >= start && d < end && p.status !== 'Dibatalkan';
    });
    const totalPurchasing = periodPOs.reduce((s, p) => s + (p.items || []).reduce((sum, it) => sum + (Number(it.price) * Number(it.qty)), 0), 0);
    const totalDebt = (db.purchase_invoices || []).filter(inv => inv.status === 'unpaid').reduce((s, inv) => s + (Number(inv.amount) || 0), 0);

    const labaKotor = totalRevenue - totalHPP;
    const labaBersih = labaKotor - totalOpEx - totalWaste;
    
    return res.json({ 
      meta, type, title: 'Laporan Laba Rugi', 
      pendapatan: { penjualanNetto: totalRevenue, total: totalRevenue }, 
      hpp: totalHPP, 
      labaKotor, 
      opEx, 
      totalOpEx, 
      totalPurchasing,
      totalDebt,
      waste: totalWaste, 
      labaBersih, 
      marginPct: totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(1) : 0 
    });
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
app.get('/api/tenants', (req, res) => {
  const db = readDB();
  res.json(db.tenants || []);
});

app.post('/api/tenant', (req, res) => {
  const db = readDB();
  if (!db.tenants) db.tenants = [];
  const newTenant = { id: Date.now(), created_at: new Date().toISOString(), ...req.body };
  db.tenants.push(newTenant);
  writeDB(db);
  res.json(newTenant);
});

app.put('/api/tenant/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = readDB();
  if (!db.tenants) db.tenants = [];
  const index = db.tenants.findIndex(t => String(t.id) === String(id));
  
  if (index >= 0) {
    db.tenants[index] = { ...db.tenants[index], ...updateData };
    writeDB(db);
    return res.json({ ok: true, tenant: db.tenants[index] });
  } 

  // Jika tidak ketemu di local, coba update di supabase
  try {
    const { data, error } = await supabase.from('tenants').update(updateData).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, tenant: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ===========================================================
// ---- FASE 7: ACCOUNTING API ENDPOINTS ----
// ===========================================================

// --- CHART OF ACCOUNTS ---
app.get('/api/accounts', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const data = await fetchFromCloud('accounts', req.headers['x-tenant-id']);
      return res.json(data.length > 0 ? data : DEFAULT_ACCOUNTS);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  res.json(db.accounts || DEFAULT_ACCOUNTS);
});

app.post('/api/accounts', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const saved = await saveToCloud('accounts', { ...req.body, tenant_id: req.headers['x-tenant-id'] });
      return res.json(saved);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  if (!db.accounts) db.accounts = [...DEFAULT_ACCOUNTS];
  const newAcc = { ...req.body, id: Date.now() };
  db.accounts.push(newAcc);
  writeDB(db);
  res.json(newAcc);
});

app.put('/api/accounts/:code', (req, res) => {
  const db = readDB();
  if (!db.accounts) db.accounts = [...DEFAULT_ACCOUNTS];
  const idx = db.accounts.findIndex(a => a.code === req.params.code);
  if (idx === -1) return res.status(404).json({ error: 'Akun tidak ditemukan' });
  db.accounts[idx] = { ...db.accounts[idx], ...req.body };
  writeDB(db);
  res.json({ ok: true, account: db.accounts[idx] });
});

// --- JOURNALS (Buku Besar Harian) ---
app.get('/api/journals', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const tenantId = req.headers['x-tenant-id'];
      const outletId = req.headers['x-outlet-id'];
      let query = supabase.from('journals').select('*').eq('tenant_id', tenantId);
      if (outletId) query = query.eq('outlet_id', outletId);
      
      const { data: journals, error: jErr } = await query.order('date', { ascending: false });
      if (jErr) throw jErr;
      
      // Fetch lines for each journal (ideally use a single join query, but this works for simple migration)
      const journalsWithLines = await Promise.all(journals.map(async (j) => {
        const { data: lines } = await supabase.from('journal_lines').select('*').eq('journal_id', j.id);
        return { ...j, lines: lines || [] };
      }));
      
      return res.json(journalsWithLines);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  const journals = (db.journals || []).map(j => ({
    ...j,
    lines: (db.journal_lines || []).filter(l => l.journalId === j.id)
  }));
  res.json(journals.reverse()); // newest first
});

app.get('/api/journals/:id', async (req, res) => {
  if (DB_MODE === 'cloud') {
    try {
      const { data: journal, error: jErr } = await supabase.from('journals').select('*').eq('id', req.params.id).single();
      if (jErr) throw jErr;
      const { data: lines } = await supabase.from('journal_lines').select('*').eq('journal_id', journal.id);
      return res.json({ ...journal, lines: lines || [] });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  const db = readDB();
  const journal = (db.journals || []).find(j => j.id === req.params.id);
  if (!journal) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
  journal.lines = (db.journal_lines || []).filter(l => l.journalId === journal.id);
  res.json(journal);
});


// ---- REPORTS & ANALYTICS ----

// ---- ACCOUNTING SUMMARY (FASE 4) ----
app.get('/api/accounting/summary', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const outletId = req.headers['x-outlet-id'];
  try {
    let journals = [];
    if (DB_MODE === 'cloud') {
      let query = supabase.from('journals').select('*, journal_lines(*)');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      if (outletId) query = query.eq('outlet_id', outletId);
      const { data, error } = await query;
      if (error) throw error;
      journals = data || [];
    } else {
      const db = readDB();
      journals = (db.journals || []).map(j => ({
        ...j,
        journal_lines: (db.journal_lines || []).filter(l => l.journalId === j.id)
      })).filter(j => j.tenantId === tenantId);
    }

    const balances = {};
    journals.forEach(j => {
      if (j.journal_lines) {
        j.journal_lines.forEach(l => {
          if (!balances[l.account_code]) balances[l.account_code] = 0;
          balances[l.account_code] += (Number(l.debit || 0) - Number(l.credit || 0));
        });
      }
    });

    const pendapatan = Math.abs(balances['4-1000'] || 0);
    const hpp = Math.abs(balances['5-1000'] || 0);
    const biaya = (Math.abs(balances['6-1000'] || 0) + Math.abs(balances['6-2000'] || 0));
    const netProfit = pendapatan - hpp - biaya;

    res.json({
      incomeStatement: { revenue: pendapatan, hpp, opex: biaya, netProfit },
      balances
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/api/version', (req, res) => res.json({ version: 'Phase 4 - Stabilized', date: '2026-05-11' }));


// ---- SYSTEM LOGS (FASE 4) ----
app.post('/api/system-logs', async (req, res) => {
  const { userName, role, activityType, description } = req.body;
  try {
    if (DB_MODE === 'cloud') {
      const { error } = await supabase.from('activity_logs').insert([
        { user_name: userName, role, activity_type: activityType, description }
      ]);
      if (error) throw error;
    }
    // Lokal: skip atau tulis ke data.json jika perlu
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Log error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---- PRODUCTION: Serve Frontend Static Files ----
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KEN Server running on port ${PORT} [Mode: ${DB_MODE}]`);
  readDB(); 
});

module.exports = app;
