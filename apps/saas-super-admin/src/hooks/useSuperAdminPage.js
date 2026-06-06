import { useState, useEffect } from 'react';
import { api } from '../api';
import { resolveFeatures } from '../lib/featureFlags';

export function useSuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFeatures, setEditingFeatures] = useState(null);
  const [selectedTenantForBilling, setSelectedTenantForBilling] = useState(null);
  
  // Register Tenant Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    tier: 'pro',
    durationDays: '30',
    paymentStatus: 'paid',
    paymentMethod: 'QRIS',
    amount: ''
  });

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

  // REGISTER TENANT VIA INTEGRATED MODAL (Direct to Supabase)
  const submitRegisterTenant = async () => {
    if (!registerForm.name.trim()) {
      alert("Nama Bisnis wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      // 1. Create the tenant first on Supabase
      const newTenant = await api.addTenant({
        name: registerForm.name,
        tier: registerForm.tier
      });

      if (!newTenant || !newTenant.id) {
        throw new Error("Gagal meregistrasikan tenant baru di Supabase.");
      }

      // 2. Build initial subscription overrides
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + Number(registerForm.durationDays));

      const subscription = {
        expires_at: expiryDate.toISOString(),
        payment_status: registerForm.paymentStatus,
        billing_cycle: Number(registerForm.durationDays) === 365 ? 'yearly' : 'monthly'
      };

      let billing_history = [];
      const paymentAmount = Number(registerForm.amount);
      
      if (registerForm.paymentStatus === 'paid' && paymentAmount > 0) {
        const invoiceNumber = `INV-${registerForm.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        billing_history.push({
          id: Date.now(),
          invoice_number: invoiceNumber,
          amount: paymentAmount,
          payment_method: registerForm.paymentMethod,
          payment_date: new Date().toISOString(),
          expiry_date: expiryDate.toISOString(),
          status: 'success'
        });
      }

      // 3. Update the tenant with initial subscription & billing log
      await api.updateTenant({
        id: newTenant.id,
        feature_overrides: {
          subscription,
          billing_history
        }
      });

      alert(`Node Client "${registerForm.name}" Berhasil Terdaftar di Supabase!`);
      setIsRegisterModalOpen(false);
      setRegisterForm({
        name: '',
        tier: 'pro',
        durationDays: '30',
        paymentStatus: 'paid',
        paymentMethod: 'QRIS',
        amount: ''
      });
      fetchTenants();
    } catch (err) {
      console.error(err);
      alert("Gagal registrasi tenant: " + err.message);
    } finally {
      setLoading(false);
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
      alert('Gapa; menyimpan konfigurasi global: ' + err.message);
    }
  };

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  // Helper: hitung sisa hari dari expires_at
  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 'N/A';
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Hari Ini';
    return `${diff} hari`;
  };


  return {
    tenants,
    loading,
    search, setSearch,
    editingFeatures, setEditingFeatures,
    selectedTenantForBilling, setSelectedTenantForBilling,
    isRegisterModalOpen, setIsRegisterModalOpen,
    registerForm, setRegisterForm,
    globalConfig, setGlobalConfig,
    fetchTenants,
    toggleStatus,
    changeTier,
    toggleFeatureOverride,
    resetFeatureOverrides,
    submitRegisterTenant,
    updateSubscriptionSettings,
    saveGlobalConfig,
    filtered,
    getDaysRemaining
  };
}
