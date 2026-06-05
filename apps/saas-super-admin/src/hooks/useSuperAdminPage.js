import { useState, useEffect } from 'react';
import { api } from '../api';
import { resolveFeatures } from '../lib/featureFlags';

export function useSuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFeatures, setEditingFeatures] = useState(null);
  const [selectedTenantForBilling, setSelectedTenantForBilling] = useState(null);
  const [globalConfig, setGlobalConfig] = useState({
    apiRateLimit: 120,
    sessionDuration: 24,
    dbPoolLimit: 40,
    sslEnforced: true,
    jwtHardening: 'High',
    aiVoidVerification: true,
    logRetentionDays: 90
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.getTenants();
      console.log('📡 [SuperAdmin] Received Tenants:', res);
      
      if (Array.isArray(res)) {
        setTenants(res);
        
        // Find superadmin tenant to extract global config
        const saTenant = res.find(t => t.id === '00000000-0000-0000-0000-000000000000');
        if (saTenant && saTenant.feature_overrides && saTenant.feature_overrides.global_config) {
          setGlobalConfig(saTenant.feature_overrides.global_config);
        }
      } else {
        console.error('📡 [SuperAdmin] Invalid response format:', res);
        setTenants([]);
      }
    } catch (err) {
      console.error('❌ [SuperAdmin] Failed to fetch tenants', err);
      alert(`🚨 GAGAL MENGAMBIL DATA: ${err.message}\n\nPastikan Anda login sebagai SuperAdmin.`);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      await api.updateTenant({ id: tenant.id, is_active: !tenant.is_active });
      fetchTenants();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const changeTier = async (tenant, newTier) => {
    try {
      await api.updateTenant({ id: tenant.id, tier: newTier });
      fetchTenants();
    } catch (err) {
      alert('Gagal update tier');
    }
  };

  const toggleFeatureOverride = async (tenant, featureKey) => {
    try {
      const overrides = tenant.feature_overrides || {};
      const newOverrides = { ...overrides, [featureKey]: !resolveFeatures(tenant)[featureKey] };
      await api.updateTenant({ id: tenant.id, feature_overrides: newOverrides });
      fetchTenants();
      setEditingFeatures({ ...tenant, feature_overrides: newOverrides }); // update modal state
    } catch (err) {
      alert('Gagal update fitur override');
    }
  };

  const resetFeatureOverrides = async (tenant) => {
    try {
      await api.updateTenant({ id: tenant.id, feature_overrides: {} });
      fetchTenants();
      setEditingFeatures({ ...tenant, feature_overrides: {} });
    } catch (err) {
      alert('Gagal reset override');
    }
  };

  const handleRegisterClient = async () => {
    const name = prompt("Masukkan Nama Bisnis/Client Baru:");
    if (name) {
      try {
        await api.addTenant({ name, tier: 'enterprise' });
        alert(`Node ${name} Berhasil Diregistrasi!`);
        fetchTenants();
      } catch (err) {
        alert("Gagal registrasi: " + err.message);
      }
    }
  };

  // SUBSCRIPTION & BILLING MANAGEMENT
  const updateSubscriptionSettings = async (tenantId, subscriptionData, newInvoice = null) => {
    try {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) return;

      const currentOverrides = tenant.feature_overrides || {};
      const newOverrides = {
        ...currentOverrides,
        subscription: {
          ...(currentOverrides.subscription || {}),
          ...subscriptionData
        }
      };

      if (newInvoice) {
        const history = currentOverrides.billing_history || [];
        newOverrides.billing_history = [newInvoice, ...history];
      }

      await api.updateTenant({ id: tenantId, feature_overrides: newOverrides });
      alert('Subskripsi berhasil diperbarui!');
      fetchTenants();
      if (selectedTenantForBilling && selectedTenantForBilling.id === tenantId) {
        setSelectedTenantForBilling({
          ...tenant,
          feature_overrides: newOverrides
        });
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui subskripsi: ' + err.message);
    }
  };

  // GLOBAL CONFIGURATION MANAGEMENT
  const saveGlobalConfig = async (newConfig) => {
    try {
      const saTenant = tenants.find(t => t.id === '00000000-0000-0000-0000-000000000000');
      if (!saTenant) {
        alert('Superadmin tenant node tidak ditemukan.');
        return;
      }

      const currentOverrides = saTenant.feature_overrides || {};
      const newOverrides = {
        ...currentOverrides,
        global_config: newConfig
      };

      await api.updateTenant({ id: saTenant.id, feature_overrides: newOverrides });
      setGlobalConfig(newConfig);
      alert('Konfigurasi Global berhasil disimpan ke Ledger!');
      fetchTenants();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan konfigurasi global: ' + err.message);
    }
  };

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return {
    tenants,
    loading,
    search, setSearch,
    editingFeatures, setEditingFeatures,
    selectedTenantForBilling, setSelectedTenantForBilling,
    globalConfig, setGlobalConfig,
    fetchTenants,
    toggleStatus,
    changeTier,
    toggleFeatureOverride,
    resetFeatureOverrides,
    handleRegisterClient,
    updateSubscriptionSettings,
    saveGlobalConfig,
    filtered
  };
}
