import { useState, useEffect } from 'react';
import { api } from '../api';
import { resolveFeatures } from '../lib/featureFlags';

export function useSuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFeatures, setEditingFeatures] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.getTenants();
      console.log('📡 [SuperAdmin] Received Tenants:', res);
      
      // Ensure res is always an array
      if (Array.isArray(res)) {
        setTenants(res);
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

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return {
    tenants,
    loading,
    search, setSearch,
    editingFeatures, setEditingFeatures,
    fetchTenants,
    toggleStatus,
    changeTier,
    toggleFeatureOverride,
    resetFeatureOverrides,
    handleRegisterClient,
    filtered
  };
}
