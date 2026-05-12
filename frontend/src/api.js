const hostname = window.location.hostname;
const port = window.location.port;
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `http://${window.location.hostname}:3001/api`
  : 'https://kuliner-web-project.vercel.app/api';

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

const getResource = (p) => {
  let r = p.replace('get', '').replace('add', '').replace('update', '').replace('save', '').replace('delete', '').toLowerCase();
  let result = r;
  // Mapping khusus
  if (r === 'shift') result = 'shifts';
  else if (r === 'transaction') result = 'transactions';
  else if (r === 'table') result = 'tables';
  else if (r === 'outlet') result = 'outlets';
  else if (r === 'grn') result = 'grns';
  else if (r === 'purchaseinvoices') result = 'purchase_invoices';
  else if (r === 'purchasepayments') result = 'purchase_payments';
  else if (r === 'bahan') result = 'bahan';
  else if (r === 'settingsloyalty') result = 'settings/loyalty';
  else if (r === 'inventorymetas' || r === 'inventorymeta') result = 'inventorymeta';
  else if (r === 'activeshifts' || r === 'activeshift') result = 'activeshift';
  else if (r === 'analyticsinventory') result = 'v1/analytics/inventory';
  else if (r === 'analyticssales') result = 'v1/analytics/sales';
  else if (r === 'analyticsfinancial') result = 'v1/analytics/financial';
  else if (!r.endsWith('s') && r !== 'po' && r !== 'grn' && r !== 'menu') result = r + 's';
  
  console.log(`[API Proxy] ${p} -> /api/${result}`);
  return result;
};

const apiBase = {
  url: API_URL,
  // Fungsi manual jika dibutuhkan
  async login(credentials) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  }
};

export const api = new Proxy(apiBase, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (typeof prop !== 'string') return undefined;

    // Handle GET
    if (prop.startsWith('get')) {
      const resource = getResource(prop);
      return async () => {
        const res = await fetch(`${API_URL}/${resource}`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Gagal mengambil data ${resource}`);
        return res.json();
      };
    }

    // Handle POST (add/save)
    if (prop.startsWith('add') || prop.startsWith('save')) {
      const resource = getResource(prop);
      return async (data) => {
        const res = await fetch(`${API_URL}/${resource}`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Gagal menyimpan data ${resource}`);
        return res.json();
      };
    }

    // Handle PUT (update)
    if (prop.startsWith('update')) {
      const resource = getResource(prop);
      return async (data) => {
        const id = data.id || data.code || '';
        const res = await fetch(`${API_URL}/${resource}/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Gagal memperbarui data ${resource}`);
        return res.json();
      };
    }

    // Handle DELETE
    if (prop.startsWith('delete')) {
      const resource = getResource(prop);
      return async (id) => {
        const res = await fetch(`${API_URL}/${resource}/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) throw new Error(`Gagal menghapus data ${resource}`);
        return res.json();
      };
    }

    return undefined;
  }
});

export default api;