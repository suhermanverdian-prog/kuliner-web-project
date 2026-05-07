const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://kuliner-web-project.vercel.app/api';

export const api = {
  url: API_URL,
  
  // Fungsi Login
  async login(username, password, role) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  // Fungsi standar GET
  async get(path) {
    const res = await fetch(`${API_URL}${path}`);
    return res.json();
  },

  // Fungsi standar POST
  async post(path, data) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Fungsi sinkronisasi offline (diperlukan oleh App.jsx)
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
      } catch (err) {
        console.error('Sync failed', err);
      }
    }
    localStorage.removeItem('offlineQueue');
  }
};

export default API_URL;
