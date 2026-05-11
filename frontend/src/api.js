const hostname = window.location.hostname;
const port = window.location.port;
const API_URL = (
  hostname === 'localhost' || 
  hostname === '127.0.0.1' || 
  hostname.startsWith('192.168.') || 
  hostname.startsWith('10.') || 
  hostname.startsWith('172.') ||
  hostname.endsWith('.local') ||
  port === '5173' || port === '5174' || port === '5175'
)
  ? `http://${hostname}:3001/api`
  : 'https://kuliner-web-project.vercel.app/api';

const apiBase = {
  url: API_URL,
  
  async login(username, password, role) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async checkout(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal checkout');
    return res.json();
  },

  async confirmPayment(id, data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/transactions/${id}/confirm-payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Gagal konfirmasi pembayaran');
    return res.json();
  },

  async updateKdsStatus(id, status) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/transactions/${id}/kds`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Gagal update status KDS');
    return res.json();
  },

  async syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (queue.length === 0) return;
    for (const item of queue) {
      try {
        await fetch(`${API_URL}${item.path}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
      } catch (err) { console.error('Sync failed', err); }
    }
    localStorage.removeItem('offlineQueue');
  },

  // FASE 5: Analitik
  async getAnalyticsSales(period) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/v1/analytics/sales?period=${period || 'month'}`, {
      headers: { 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' }
    });
    return res.json();
  },
  async getAnalyticsFinancial(period) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/v1/analytics/financial?period=${period || 'month'}`, {
      headers: { 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' }
    });
    return res.json();
  },
  async getSettingsLoyalty() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/settings/loyalty`, {
      headers: { 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' }
    });
    return res.json();
  },
  async saveSettingsLoyalty(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/settings/loyalty`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': user.role || 'guest', 
        'x-tenant-id': user.tenant?.id || '' 
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// Gunakan Proxy agar semua fungsi seperti getTransactions, getMenu, dll otomatis jalan
export const api = new Proxy(apiBase, {
  get(target, prop) {
    if (prop in target) return target[prop];
    
    // Helper untuk headers otentikasi
    const getHeaders = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const currentOutletId = localStorage.getItem('currentOutletId') || '';
      return {
        'Content-Type': 'application/json',
        'x-user-role': user.role || 'guest',
        'x-tenant-id': user.tenant?.id || '',
        'x-outlet-id': currentOutletId
      };
    };

    // Helper untuk normalisasi resource
    const getResource = (p) => {
      let r = p.replace('get', '').replace('add', '').replace('update', '').replace('save', '').replace('delete', '').toLowerCase();
      if (r === 'shift') return 'shifts';
      if (r === 'transaction') return 'transactions';
      if (r === 'purchaseorders' || r === 'po') return 'po';
      if (r === 'purchaseinvoices') return 'purchase_invoices';
      if (r === 'purchasepayments') return 'purchase_payments';
      if (r === 'grn') return 'grns';
      if (r === 'supplier') return 'suppliers';
      if (r === 'outlet') return 'outlets';
      if (r === 'tenant' && p.startsWith('get')) return 'tenants';
      if (r === 'analyticsinventory') return 'v1/analytics/inventory';
      if (r === 'analyticssales') return 'v1/analytics/sales';
      if (r === 'analyticsfinancial') return 'v1/analytics/financial';
      return r;
    };

    // Jika fungsi yang dipanggil berawalan 'get' (contoh: getTransactions)
    if (prop.startsWith('get')) {
      const resource = getResource(prop);
      return async () => {
        const res = await fetch(`${API_URL}/${resource}`, { headers: getHeaders() });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || res.statusText || 'Gagal mengambil data');
        }
        return res.json();
      };
    }
    
    // Jika fungsi berawalan 'add', 'update', atau 'save'
    if (prop.startsWith('add') || prop.startsWith('update') || prop.startsWith('save')) {
        return async (data) => {
          const isUpdate = prop.startsWith('update') && data.id;
          const resource = getResource(prop);
          const url = isUpdate ? `${API_URL}/${resource}/${data.id}` : `${API_URL}/${resource}`;
          const res = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || res.statusText || 'Gagal menyimpan data');
          }
          return res.json();
        };
    }

    // Jika fungsi berawalan 'delete'
    if (prop.startsWith('delete')) {
      return async (id) => {
        const res = await fetch(`${API_URL}/${getResource(prop)}/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || res.statusText || 'Gagal menghapus data');
        }
        return res.json();
      };
    }

    return target[prop];
  }
});

export default API_URL;
