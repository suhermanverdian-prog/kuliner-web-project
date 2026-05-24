const API_URL = import.meta.env.VITE_API_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:3001/api`
    : '/api');

import * as Sentry from '@sentry/react';

const getHeaders = () => {
  let token = null;
  let tenantId = null;

  // 1. Try to get from Zustand Storage (Primary)
  const storageStr = localStorage.getItem('ken-enterprise-storage');
  if (storageStr) {
    try {
      const storage = JSON.parse(storageStr);
      const state = storage.state || storage;
      const user = state.user || state;
      if (user) {
        token = user.token;
        const innerUser = user.user || user;
        tenantId = innerUser.tenant_id || user.tenant_id;
      }
    } catch (e) {}
  }

  // 2. Fallback to Direct Keys (if direct login/bypass is used)
  token = token || localStorage.getItem('token');
  tenantId = tenantId || localStorage.getItem('tenantId');

  const headers = { 'Content-Type': 'application/json' };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
    headers['x-tenant-id'] = tenantId;
  }
  
  return headers;
};

// --- ELITE PROXY ENGINE ---
const getResource = (prop) => {
  const map = {
    // Inventory
    'getBahan': 'inventory',
    'saveBahan': 'inventory',
    'updateBahan': 'inventory',
    'getInventory': 'inventory',
    'getLowStock': 'inventory/low-stock',
    'getInventoryMeta': 'inventory/meta',
    'getInventoryPredictions': 'inventory/predictions',
    'getInventoryLogs': 'inventory/logs',
    'getInventoryLogistics': 'inventory/logistics',
    
    // System & Shifts
    'getShifts': 'shifts',
    'addShift': 'shifts',
    'getActiveShift': 'shifts/active',
    'closeShift': 'shifts',
    'getTables': 'system/tables',
    'saveTable': 'system/tables',
    'deleteTable': 'system/tables',
    'getLocations': 'system/locations',
    'getOutlets': 'system/outlets',
    'addOutlet': 'system/outlets',
    'updateOutlet': 'system/outlets',
    'deleteOutlet': 'system/outlets',
    'getSettings': 'system/settings',
    'saveSettings': 'system/settings',
    'getOutletInfo': 'system/outletinfos',
    'getSettingsLoyalty': 'system/settings/loyalty',
    'saveSettingsLoyalty': 'system/settings/loyalty',
    
    // Menu
    'getMenu': 'menu',
    'addMenu': 'menu',
    'updateMenu': 'menu',
    
    // Transactions
    'getTransactions': 'transactions',
    'checkout': 'transactions',
    'confirmPayment': 'transactions', // Will append /id/confirm in logic
    'updateKdsStatus': 'transactions',
    
    // User Management
    'saveUser': 'users',
    'deleteUser': 'users',
    'getUsers': 'users',
    'getRolePermissions': 'roles/permissions',
    'saveRolePermissions': 'roles/permissions',
    'updateTenantFeatures': 'tenant/me/features',
    
    // Procurement
    'getPOs': 'p/pos',
    'addPO': 'p/pos',
    'getInvoices': 'p/invoices',
    'getPurchaseInvoices': 'p/invoices',
    'updatePurchaseInvoice': 'p/invoices',
    'getSuppliers': 'p/suppliers',
    'addSupplier': 'p/suppliers',
    'getConversions': 'p/conversions',
    'addGRN': 'p/grns',
    
    // Laporan (Reports)
    'getLaporanSummary': 'laporan/summary',
    'getLaporanTrend': 'laporan/trend',
    'getLaporanPaymentMethods': 'laporan/payment-methods',
    'getLaporanTopProducts': 'laporan/top-products',
    'getLaporanCriticalStock': 'laporan/critical-stock',
    'getLaporanWaste': 'laporan/waste',
    'getLaporanInsights': 'laporan/insights',
    'getAiInsights': 'ai/insights',
    'getPricingSuggestions': 'ai/pricing-suggestions',
    'getInventoryForecast': 'ai/inventory-forecast',
    
    // Inventory Intelligence
    'getInventoryPredictions': 'inventory/predictions',
    'getInventoryLogs': 'inventory/logs',
    'getInventoryWaste': 'inventory/waste',
    
    // Accounting
    'getAccountingSummary': 'accounting/summary',
    'getAccounts': 'accounting/accounts',
    'getJournals': 'accounting/journals'
  };
  return map[prop] || prop.replace(/get|add|update|delete|save/i, '').toLowerCase();
};

const apiBase = {
  url: API_URL,
  
  // Generic Request Handler
  async request(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: getHeaders(),
    };
    if (data) options.body = JSON.stringify(data);
    
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const finalError = new Error(error.message || `API Error ${response.status}`);
        Sentry.captureException(finalError, { extra: { url, method, data } });
        throw finalError;
      }
      return await response.json();
    } catch (err) {
      // Tangkap network error (misal: ERR_CONNECTION_REFUSED)
      Sentry.captureException(err, { extra: { url, method, data } });
      throw err;
    }
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const headers = getHeaders();
    delete headers['Content-Type'];
    
    try {
      const res = await fetch(`${API_URL}/upload`, { 
        method: 'POST', 
        headers, 
        body: formData 
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `Upload failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error("🚨 [UploadError] Image upload failed:", err);
      throw err;
    }
  },

  async paySalary(employeeId, data) {
    const res = await fetch(`${API_URL}/accounting/payroll`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ employeeId, ...data })
    });
    return res.json();
  },

  async closeShift(id, data = {}) {
    const res = await fetch(`${API_URL}/shifts/${id}/close`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

const apiProxy = new Proxy(apiBase, {
  get(target, prop) {
    if (prop in target) return target[prop];
    
    // Dynamic Method Generator
    return async (idOrData = null, optionalData = null) => {
      const resource = getResource(prop);
      let url = `${API_URL}/${resource}`;
      let method = 'GET';
      let payload = null;

      // 1. Detect Method
      if (prop.startsWith('get')) method = 'GET';
      else if (prop.startsWith('add') || prop.startsWith('post') || prop === 'login' || prop === 'closeShift') method = 'POST';
      else if (prop.startsWith('update') || prop.startsWith('put') || prop === 'confirmPayment') method = 'PUT';
      else if (prop.startsWith('delete')) method = 'DELETE';
      else if (prop === 'checkout') method = 'POST';
      else if (prop.startsWith('save')) {
         // Custom logic for saveXXX(data). If data has an 'id', use PUT, otherwise POST.
         method = idOrData?.id ? 'PUT' : 'POST';
      }

      // 2. Argument & Action Handling
      if (prop.startsWith('save')) {
        // Pattern: save(data) -> /resource or /resource/id
        payload = idOrData;
        if (idOrData?.id) url += `/${idOrData.id}`;
      } else if (optionalData !== null) {
        // Pattern: method(id, data) -> /resource/id/action
        url += `/${idOrData}`;
        payload = optionalData;
        if (prop === 'updateKdsStatus') {
          payload = { status: optionalData };
        }
      } else {
        // Pattern: method(data) -> /resource
        payload = idOrData;
        if (method === 'DELETE' && idOrData && typeof idOrData !== 'object') {
           url += `/${idOrData}`;
           payload = null;
        }
      }

      // Add Action Suffixes
      if (prop.startsWith('close') && prop.endsWith('Shift')) url += '/close';
      if (prop === 'confirmPayment') url += '/confirm';
      if (prop === 'updateKdsStatus') url += '/kds';

      // --- ENTERPRISE QUERY ENGINE ---
      if (method === 'GET' && payload && typeof payload === 'object') {
        const params = new URLSearchParams(payload).toString();
        if (params) url += (url.includes('?') ? '&' : '?') + params;
        payload = null; // GET requests don't have bodies
      }

      return target.request(url, method, payload);
    };
  }
});

export default apiProxy;
export { apiProxy as api };