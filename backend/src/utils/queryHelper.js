// backend/src/utils/queryHelper.js

/**
 * @function applyScopeFilter
 * @description Menyaring query Supabase secara dinamis berdasarkan Tenant, Peran (Role), Skop (Scope), dan Outlet yang diizinkan.
 * @param {object} query - Objek query PostgREST Supabase.
 * @param {object} userContext - Objek req.userContext (userId, role, tenantId, outletId, scope, allowed_outlets).
 * @returns {object} Objek query yang telah disaring.
 */
const applyScopeFilter = (query, userContext) => {
  if (!userContext) return query;

  const { role, tenantId, scope, allowed_outlets } = userContext;

  // 1. Superadmin bypass: bisa melihat data dari seluruh tenant & outlet
  if (role === 'superadmin') {
    return query;
  }

  // 2. Kunci data wajib ke tenant_id milik pengguna
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  // 3. Batasan Skop Data untuk Non-Owner (Manager, Kasir, Dapur, Akuntan, dll)
  if (role !== 'owner') {
    // Jika skopnya dibatasi per outlet tunggal
    if (scope === 'outlet' && Array.isArray(allowed_outlets) && allowed_outlets.length > 0) {
      query = query.in('outlet_id', allowed_outlets);
    } 
    // Jika skopnya dibatasi ke sekelompok outlet regional
    else if (scope === 'regional' && Array.isArray(allowed_outlets) && allowed_outlets.length > 0) {
      query = query.in('outlet_id', allowed_outlets);
    }
  }

  return query;
};

module.exports = {
  applyScopeFilter
};
