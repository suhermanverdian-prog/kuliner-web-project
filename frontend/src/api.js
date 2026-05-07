const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://kuliner-web-project.vercel.app/api';

export const api = {
  url: API_URL,
  
  // Fungsi sinkronisasi offline (diperlukan oleh App.jsx)
  async syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (queue.length === 0) return;
    
    console.log('Syncing offline queue...');
    // Logika sinkronisasi sederhana
    for (const item of queue) {
      try {
        await fetch(`${API_URL}${item.path}`, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
      } catch (err) {
        console.error('Sync failed for item', item);
      }
    }
    localStorage.removeItem('offlineQueue');
  }
};

export default API_URL;
