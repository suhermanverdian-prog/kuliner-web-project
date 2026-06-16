const API_URL = import.meta.env.VITE_API_URL || 
  ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:3001/api`
    : '/api');

import * as Sentry from '@sentry/react';

const getHeaders = () => {
  let token = null;
  let tenantId = null;

  // Primary: Zustand store in localStorage
  const storageStr = localStorage.getItem('ken-enterprise-storage');
  if (storageStr) {
    try {
      const storage = JSON.parse(storageStr);
      const state = storage.state || storage;
      const user = state.user || state;
      if (user) {
        token = user.token;
        const innerUser = user.user || user;
        tenantId = innerUser.tenant_id || user.tenant_id || (state.tenant && (state.tenant.id || state.tenant));
      }
    } catch (e) {
      console.error("[KEN API] Error parsing store for headers:", e);
    }
  }

  // Fallbacks: direct localStorage keys
  token = token || localStorage.getItem('token');
  tenantId = tenantId || localStorage.getItem('tenantId') || localStorage.getItem('tenant_id');

  console.log("[KEN API] Headers Debug:", {
    hasStoreStr: !!storageStr,
    tokenFound: !!token,
    tenantIdFound: !!tenantId,
    tokenPrefix: token ? token.substring(0, 10) + '...' : null,
    tenantId
  });

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
    'deleteBahan': 'inventory',
    'getInventory': 'inventory',
    'getLowStock': 'inventory/low-stock',
    'getInventoryMeta': 'inventory/meta',
    'getInventoryPredictions': 'inventory/predictions',
    'getInventoryLogs': 'inventory/logs',
    'getInventoryLogistics': 'inventory/logistics',
    'getCategories': 'inventory/categories',
    'createCategory': 'inventory/categories',
    'deleteCategory': 'inventory/categories',
    'assembleInventory': 'inventory/assemble',
    
    // System & Shifts
    'getShifts': 'shifts',
    'addShift': 'shifts',
    'getActiveShift': 'shifts/active-public',
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
    'getSystemLogs': 'system/system-logs',
    
    // Menu
    'getMenu': 'menu',
    'addMenu': 'menu',
    'updateMenu': 'menu',
    
    // Transactions
    'getTransactions': 'transactions',
    'checkout': 'transactions',
    'confirmPayment': 'transactions', // Will append /id/confirm in logic
    'updateKdsStatus': 'transactions',
    'requestVoid': 'transactions',
    'approveVoid': 'transactions',
    
    // User Management
    'saveUser': 'users',
    'deleteUser': 'users',
    'getUsers': 'users',
    'getRolePermissions': 'roles/permissions',
    'saveRolePermissions': 'roles/permissions',
    'getCustomisations': 'customisations',
    'saveCustomisations': 'customisations',
    'getTenants': 'tenants',
    'addTenant': 'tenants',
    'updateTenant': 'tenants',
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
    'addSimplePurchase': 'p/simple-purchase',
    'getReplenishmentPredictions': 'p/replenishment-predictions',
    
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
    
    // Corporate Partners (B2B)
    'getCorporate': 'corporate',
    'addCorporate': 'corporate',
    'updateCorporate': 'corporate',
    'deleteCorporate': 'corporate',
    
    // Promo Codes
    'getPromoCodes': 'promo-codes',
    'addPromoCode': 'promo-codes',
    'updatePromoCode': 'promo-codes',
    'deletePromoCode': 'promo-codes',
    
    // Inventory Intelligence
    'getInventoryPredictions': 'inventory/predictions',
    'getInventoryLogs': 'inventory/logs',
    'getInventoryWaste': 'inventory/waste',
    
    // Accounting
    'getAccountingSummary': 'accounting/summary',
    'getAccounts': 'accounting/accounts',
    'getJournals': 'accounting/journals',

    // Budgeting
    'getBudgets': 'accounting/budgets',
    'saveBudget': 'accounting/budgets',
    'deleteBudget': 'accounting/budgets',
    'getBudgetVariance': 'accounting/budgets/variance',

    // Stok Opname (Blind SO)
    'getOpnameSessions': 'opname',
    'getOpnameSessionById': 'opname',
    'startOpname': 'opname',
    'recordOpnameCount': 'opname',
    'completeOpname': 'opname',
    'approveOpname': 'opname',
    'cancelOpname': 'opname',
    // NOTE: getOpnameOutletSummary is handled as a direct method below (not proxy)
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
        // --- KEN ENTERPRISE: GLOBAL 401 INTERCEPTOR ---
        if (response.status === 401) {
          const path = window.location.pathname;
          const isGuestApp = path.includes('/guest') || path.includes('/store') || path.includes('/order');
          
          if (!isGuestApp) {
            console.warn(`[KEN API] 401 Unauthorized Detected. Forcing logout to prevent stale session...`);
            localStorage.removeItem('ken-enterprise-storage');
            localStorage.removeItem('token');
            localStorage.removeItem('tenantId');
            window.location.href = '/login'; // Correct BrowserRouter path
          }
        }

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
  },

  // ====================================================================
  // Scheduled Opname & Accounting Integration Direct API Methods
  // ====================================================================
  async getOpnameSchedules() {
    return this.request(`${API_URL}/opname/schedules`, 'GET');
  },

  async addOpnameSchedule(data) {
    return this.request(`${API_URL}/opname/schedules`, 'POST', data);
  },

  async updateOpnameSchedule(id, data) {
    return this.request(`${API_URL}/opname/schedules/${id}`, 'PUT', data);
  },

  async deleteOpnameSchedule(id) {
    return this.request(`${API_URL}/opname/schedules/${id}`, 'DELETE');
  },

  async getOpnameScheduleHistory(id) {
    return this.request(`${API_URL}/opname/schedules/${id}/history`, 'GET');
  },

  async getOpnameTemplates() {
    return this.request(`${API_URL}/opname/accounting/templates`, 'GET');
  },

  async createOpnameTemplate(data) {
    return this.request(`${API_URL}/opname/accounting/templates`, 'POST', data);
  },

  async createOpnameJournals(sessionId, templateId = null) {
    return this.request(`${API_URL}/opname/${sessionId}/journals/create`, 'POST', { templateId });
  },

  async postOpnameJournals(sessionId, data) {
    return this.request(`${API_URL}/opname/${sessionId}/journals/post`, 'POST', data);
  },

  async getOpnameReconciliation() {
    return this.request(`${API_URL}/opname/accounting/reconciliation`, 'GET');
  },

  // FIX: outletId harus dikirim sebagai URL path param, bukan body (GET tidak boleh punya body)
  async getOpnameOutletSummary(outletId) {
    return this.request(`${API_URL}/opname/outlet/${outletId}/summary`, 'GET');
  },

  // Owner Security Audit: Endpoint verifikasi integritas kriptografis log audit
  async getSystemIntegrity() {
    return this.request(`${API_URL}/system/integrity`, 'GET');
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
      else if (prop.startsWith('add') || prop.startsWith('post') || prop.startsWith('create') || prop.startsWith('assemble') || prop.startsWith('start') || prop.startsWith('record') || prop.startsWith('complete') || prop.startsWith('approve') || prop.startsWith('cancel') || prop === 'login' || prop === 'closeShift') method = 'POST';
      else if (prop.startsWith('update') || prop.startsWith('put') || prop === 'confirmPayment') method = 'PUT';
      else if (prop.startsWith('delete')) method = 'DELETE';
      else if (prop === 'checkout' || prop === 'requestVoid' || prop === 'approveVoid') method = 'POST';
      else if (prop.startsWith('save')) {
         // Custom logic for saveXXX(data). If data has an 'id', use PUT, otherwise POST.
         if (prop === 'saveSettings' || prop === 'saveSettingsLoyalty') {
             method = 'POST'; // Settings always use POST for upsert
         } else {
             method = idOrData?.id ? 'PUT' : 'POST';
         }
      }

      // 2. Argument & Action Handling
      if (prop === 'requestVoid' || prop === 'approveVoid') {
         url += `/${idOrData}`;
         payload = { reason: optionalData || 'Pembatalan transaksi POS' };
      } else if (prop.startsWith('save')) {
         // Pattern: save(data) -> /resource or /resource/id
        payload = idOrData;
        if (idOrData?.id && prop !== 'saveSettings' && prop !== 'saveSettingsLoyalty') {
            url += `/${idOrData.id}`;
        }
      } else if (optionalData !== null) {
        // Pattern: method(id, data) -> /resource/id/action
        url += `/${idOrData}`;
        payload = optionalData;
        if (prop === 'updateKdsStatus') {
          payload = { status: optionalData };
        }
        // Pattern: method(data) -> /resource
        payload = idOrData;
        if (idOrData && typeof idOrData !== 'object') {
          if (method === 'GET' && prop === 'getActiveShift') {
            payload = { tenantId: idOrData };
          } else {
            url += `/${idOrData}`;
            payload = null;
          }
        }
      }

      // PUT/PATCH with { id, ... } -> /resource/:id (e.g. updateTenant)
      if (
        (method === 'PUT' || method === 'PATCH') &&
        payload &&
        typeof payload === 'object' &&
        payload.id &&
        !url.endsWith(`/${payload.id}`) &&
        !url.includes('/tenant/me/')
      ) {
        url += `/${payload.id}`;
      }

      // Add Action Suffixes
      if (prop.startsWith('close') && prop.endsWith('Shift')) url += '/close';
      if (prop === 'confirmPayment') url += '/confirm';
      if (prop === 'updateKdsStatus') url += '/kds';
      if (prop === 'requestVoid') url += '/request-void';
      if (prop === 'approveVoid') url += '/approve-void';
      if (prop === 'recordOpnameCount') url += '/record';
      if (prop === 'completeOpname') url += '/complete';
      if (prop === 'approveOpname') url += '/approve';
      if (prop === 'cancelOpname') url += '/cancel';
      if (prop === 'getOpnameOutletSummary') url += '/summary';

      // --- ENTERPRISE QUERY ENGINE ---
      if (method === 'GET' && payload) {
        if (typeof payload === 'object') {
          const params = new URLSearchParams(payload).toString();
          if (params) url += (url.includes('?') ? '&' : '?') + params;
        }
        payload = null; // GET requests don't have bodies
      }

      return target.request(url, method, payload);
    };
  }
});

export default apiProxy;
export { apiProxy as api };