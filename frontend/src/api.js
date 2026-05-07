const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
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
  }
};

// Gunakan Proxy agar semua fungsi seperti getTransactions, getMenu, dll otomatis jalan
export const api = new Proxy(apiBase, {
  get(target, prop) {
    if (prop in target) return target[prop];
    
    // Jika fungsi yang dipanggil berawalan 'get' (contoh: getTransactions)
    if (prop.startsWith('get')) {
      const resource = prop.replace('get', '').toLowerCase();
      return () => fetch(`${API_URL}/${resource}`).then(res => res.json());
    }
    
    // Jika fungsi berawalan 'add' atau 'update'
    if (prop.startsWith('add') || prop.startsWith('update')) {
      return (data) => fetch(`${API_URL}/${prop.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json());
    }

    return target[prop];
  }
});

export default API_URL;
