const API_URL = window.location.hostname === 'localhost' \n  ? 'http://localhost:3001/api' \n  : 'https://nama-backend-anda.onrender.com/api';

// --- OFFLINE SUPPORT HELPERS ---
const safeFetch = async (url, options = {}) => {
  const method = options.method || 'GET';

  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    // Simpan ke cache jika GET
    if (method === 'GET') {
      localStorage.setItem(`cache_${url}`, JSON.stringify(data));
    }
    return data;
  } catch (error) {
    // Jika tidak ada koneksi atau gagal fetch
    if (!navigator.onLine || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      if (method === 'GET') {
        const cached = localStorage.getItem(`cache_${url}`);
        if (cached) return JSON.parse(cached);
        throw new Error('Anda sedang offline dan data belum tersimpan secara lokal.');
      } else {
        // Untuk POST/PUT/DELETE, antrekan request ke localStorage
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        const mockId = `OFFLINE-${Date.now()}`;

        let mockData = { id: mockId, offline: true, _isMock: true };
        if (options.body) {
          try {
            mockData = { ...mockData, ...JSON.parse(options.body) };
          } catch (e) { }
        }

        queue.push({ url, options, id: mockId, timestamp: Date.now() });
        localStorage.setItem('offlineQueue', JSON.stringify(queue));

        console.warn(`[Offline Mode] Request ke ${url} masuk antrean.`, mockData);

        // Memicu custom event agar UI bisa tahu ada data yang mengantre
        window.dispatchEvent(new CustomEvent('offlineRequestQueued'));

        return mockData;
      }
    }
    throw error;
  }
};

export const api = {
  // Sync Fungsi untuk dipanggil ketika online
  syncOfflineQueue: async () => {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (queue.length === 0 || !navigator.onLine) return;

    console.log(`Menyinkronkan ${queue.length} antrean data ke server...`);
    const failedQueue = [];

    for (const req of queue) {
      try {
        await fetch(req.url, req.options);
      } catch (err) {
        failedQueue.push(req);
      }
    }

    localStorage.setItem('offlineQueue', JSON.stringify(failedQueue));
    if (failedQueue.length === 0) {
      console.log('✅ Semua data offline berhasil disinkronkan!');
    }
  },

  // === AUTH ===
  login: async (username, password, role) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) throw new Error('Kredensial tidak valid');
    return res.json();
  },

  // === MENU ===
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Gagal mengunggah gambar');
    return res.json();
  },
  getMenu: () => safeFetch(`${API_URL}/menu`),
  saveMenu: (item) => {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `${API_URL}/menu/${item.id}` : `${API_URL}/menu`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  },
  deleteMenu: (id) => safeFetch(`${API_URL}/menu/${id}`, { method: 'DELETE' }),

  // === BAHAN BAKU ===
  getBahan: () => safeFetch(`${API_URL}/bahan`),
  saveBahan: (item) => {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? `${API_URL}/bahan/${item.id}` : `${API_URL}/bahan`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  },
  deleteBahan: (id) => safeFetch(`${API_URL}/bahan/${id}`, { method: 'DELETE' }),

  // === TRANSAKSI ===
  getTransactions: () => safeFetch(`${API_URL}/transactions`),
  checkout: (transactionData) => safeFetch(`${API_URL}/transactions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transactionData)
  }),
  confirmPayment: (id, paymentData) => safeFetch(`${API_URL}/transactions/${id}/confirm-payment`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentData)
  }),
  simulateWebhook: (data) => safeFetch(`${API_URL}/payments/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  updateKdsStatus: (id, status) => safeFetch(`${API_URL}/transactions/${id}/kds`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
  }),

  // === TABLES ===
  getTables: () => safeFetch(`${API_URL}/tables`),
  saveTable: (data) => {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_URL}/tables/${data.id}` : `${API_URL}/tables`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  deleteTable: (id) => safeFetch(`${API_URL}/tables/${id}`, { method: 'DELETE' }),

  // === SHIFTS ===
  getShifts: () => safeFetch(`${API_URL}/shifts`),
  saveShift: (data) => {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_URL}/shifts/${data.id}` : `${API_URL}/shifts`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },

  // === USERS ===
  getUsers: () => safeFetch(`${API_URL}/users`),
  saveUser: (data) => {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_URL}/users/${data.id}` : `${API_URL}/users`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  deleteUser: (id) => safeFetch(`${API_URL}/users/${id}`, { method: 'DELETE' }),

  // === CUSTOMERS ===
  getCustomers: () => safeFetch(`${API_URL}/customers`),
  addCustomer: (data) => safeFetch(`${API_URL}/customers`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),

  // === SETTINGS ===
  getSettings: () => safeFetch(`${API_URL}/settings`),
  saveSettings: (data) => safeFetch(`${API_URL}/settings`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),

  // === SUPPLIERS ===
  getSuppliers: () => safeFetch(`${API_URL}/suppliers`),
  saveSupplier: (data) => {
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `${API_URL}/suppliers/${data.id}` : `${API_URL}/suppliers`;
    return safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  deleteSupplier: (id) => safeFetch(`${API_URL}/suppliers/${id}`, { method: 'DELETE' }),

  // === PURCHASE ORDERS (PO) ===
  getPO: () => safeFetch(`${API_URL}/po`),
  savePO: (data) => safeFetch(`${API_URL}/po`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  updatePOStatus: (id, status, items) => safeFetch(`${API_URL}/po/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, items })
  }),

  // === LOCATIONS ===
  getLocations: () => safeFetch(`${API_URL}/locations`),
  saveLocation: (data) => safeFetch(`${API_URL}/locations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  deleteLocation: (id) => safeFetch(`${API_URL}/locations/${id}`, { method: 'DELETE' }),

  // === STOCK TRANSFER ===
  transferStock: (transferData) => safeFetch(`${API_URL}/stock-transfer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transferData)
  }),

  // === INVENTORY META ===
  getInventoryMeta: () => safeFetch(`${API_URL}/inventory/meta`),
  saveInventoryMeta: (data) => safeFetch(`${API_URL}/inventory/meta`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  })
};
