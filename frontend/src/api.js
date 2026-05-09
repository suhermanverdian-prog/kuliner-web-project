const hostname = window.location.hostname;
const API_URL = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.'))
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

  async updateKdsStatus(id, status) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/transactions/${id}/kds`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' },
      body: JSON.stringify({ status })
    });
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
  async getAnalyticsInventory(period) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_URL}/v1/analytics/inventory?period=${period || 'month'}`, {
      headers: { 'x-user-role': user.role || 'guest', 'x-tenant-id': user.tenant?.id || '' }
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
      return {
        'Content-Type': 'application/json',
        'x-user-role': user.role || 'guest',
        'x-tenant-id': user.tenant?.id || ''
      };
    };

    // Jika fungsi yang dipanggil berawalan 'get' (contoh: getTransactions)
    if (prop.startsWith('get')) {
      let resource = prop.replace('get', '').toLowerCase();
      if (resource === 'shift') resource = 'shifts';
      if (resource === 'transaction') resource = 'transactions';
      return () => fetch(`${API_URL}/${resource}`, { headers: getHeaders() }).then(res => res.json());
    }
    
    // Jika fungsi berawalan 'add', 'update', atau 'save'
    if (prop.startsWith('add') || prop.startsWith('update') || prop.startsWith('save')) {
      return (data) => {
        const isUpdate = prop.startsWith('update') && data.id;
        let resource = prop.replace('add', '').replace('update', '').replace('save', '').toLowerCase();
        if (resource === 'shift') resource = 'shifts';
        if (resource === 'transaction') resource = 'transactions';
        const url = isUpdate ? `${API_URL}/${resource}/${data.id}` : `${API_URL}/${resource}`;
        return fetch(url, {
          method: isUpdate ? 'PUT' : 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        }).then(res => res.json());
      };
    }

    // Jika fungsi berawalan 'delete'
    if (prop.startsWith('delete')) {
      return (id) => fetch(`${API_URL}/${prop.replace('delete', '').toLowerCase()}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(res => res.json());
    }

    return target[prop];
  }
});

export default API_URL;
