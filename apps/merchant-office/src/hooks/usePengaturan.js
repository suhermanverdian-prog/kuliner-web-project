import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAppStore } from '../store/useAppStore';

export function usePengaturan() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const globalUser = useAppStore(state => state.user);
  const tenant = useMemo(() => globalUser?.tenant || user?.tenant, [globalUser?.tenant?.id]);

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    return searchParams.get('tab') || 'users';
  }, [searchParams]);

  const setActiveTab = useCallback((newTab) => {
    setSearchParams({ tab: newTab, standalone: 'true' });
  }, [setSearchParams]);
  const [settings, setSettings] = useState({ storeName: '', taxPct: 0, servicePct: 0 });
  const [aiConfig, setAiConfig] = useState({ provider: 'openai', apiKey: '', isEnabled: false });
  const [userSubTab, setUserSubTab] = useState('profil');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [featureOverrides, setFeatureOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('/logo-ken.webp');
  const [loyaltyConfig, setLoyaltyConfig] = useState({ enabled: true, multiplier: 10000 });
  const [tierRules, setTierRules] = useState({
    member: { min_spend: 250000, min_visits: 3, points_multiplier: 1.5 },
    vip: { min_spend: 1000000, min_visits: 10, points_multiplier: 2.0 }
  });
  const [geofence, setGeofence] = useState({ latitude: 0, longitude: 0, radius: 100 });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: 'manual_transfer', account_number: '', account_name: '', instructions: '' });
  const [editingPayment, setEditingPayment] = useState(null);
  const [outlets, setOutlets] = useState([]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRolePermissions = useCallback(async () => {
    try {
      const data = await api.getRolePermissions();
      setRolePermissions(data || []);
    } catch (err) {
      console.error("Failed to fetch role permissions", err);
    }
  }, []);

  // Run once on mount to prevent infinite loops from unstable localStorage parses
  useEffect(() => {
    fetchUsers();
    fetchRolePermissions();
    api.getSettings().then(s => { 
      if (s) {
        setSettings(s);
        if (s.tier_rules) setTierRules(s.tier_rules);
      } 
    }).catch(() => {});
    api.getSettingsLoyalty().then(l => { if (l) setLoyaltyConfig(l); }).catch(() => {});
    api.getOutletInfo().then(o => { if (o) setGeofence({ latitude: o.latitude || 0, longitude: o.longitude || 0, radius: o.geofence_radius || 100 }); }).catch(() => {});
    api.getPaymentMethods().then(p => { if (p) setPaymentMethods(p); }).catch(() => {});
    api.getOutlets().then(o => { if (o) setOutlets(Array.isArray(o) ? o : []); }).catch(() => {});
    
    // Load AI Config from localStorage
    const savedAi = localStorage.getItem('ken_ai_config');
    if (savedAi) setAiConfig(JSON.parse(savedAi));

    if (tenant?.feature_overrides) {
      setFeatureOverrides(tenant.feature_overrides);
    }
  }, []);



  const toggleRolePerm = useCallback((roleId, permKey) => {
    if (!selectedRole) return;
    
    const keyMap = {
      'akses_kasir': 'pos',
      'akses_gudang': 'inventory',
      'akses_dapur': 'kds',
      'akses_keuangan': 'accounting',
      'lihat_hpp': 'laporan', 
      'lihat_laba': 'dashboard',
      'hapus_transaksi': 'transactions',
      'atur_user': 'system'
    };
    
    setRolePermissions(prev => {
       const featureKey = keyMap[permKey] || permKey;
       const exists = prev.find(p => p.role === selectedRole && p.feature_key === featureKey);
       if (exists) {
          return prev.filter(p => p.id !== exists.id && !(p.role === selectedRole && p.feature_key === featureKey));
       } else {
          return [...prev, { role: selectedRole, feature_key: featureKey, can_view: true, can_create: true, can_edit: true, can_delete: permKey === 'hapus_transaksi' }];
       }
    });
  }, [selectedRole]);

  const handleSaveUser = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await api.saveUser(selected);
      await fetchUsers();
      showToast('Profil pengguna berhasil disimpan!');
    } catch { 
      showToast('Gagal menyimpan perubahan profil.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
       setLoading(true);
       const currentPerms = rolePermissions.filter(p => p.role === selectedRole);
       const permissionsObj = {};
       const revKeyMap = {
          'pos': 'akses_kasir',
          'inventory': 'akses_gudang',
          'kds': 'akses_dapur',
          'accounting': 'akses_keuangan',
          'laporan': 'lihat_hpp',
          'dashboard': 'lihat_laba',
          'transactions': 'hapus_transaksi',
          'system': 'atur_user'
       };
       currentPerms.forEach(p => {
          const uiKey = revKeyMap[p.feature_key] || p.feature_key;
          permissionsObj[uiKey] = true;
       });
       
       await api.saveRolePermissions({ role: selectedRole, permissions: permissionsObj });
       await fetchRolePermissions();
       showToast(`Hak akses berhasil disimpan!`);
    } catch { 
      showToast('Gagal menyimpan hak akses.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Yakin hapus pengguna ini?')) return;
    try {
      await api.deleteUser(userId);
      setSelected(null);
      await fetchUsers();
      showToast('Pengguna berhasil dihapus!');
    } catch { 
      showToast('Gagal menghapus pengguna.', 'error'); 
    }
  };

  const handleAddUser = async (formData) => {
    if (!formData.name || !formData.username || !formData.password)
      return showToast('Semua kolom wajib diisi!', 'error');
    try {
      setLoading(true);
      await api.saveUser({
        ...formData,
        avatar_url: formData.avatar_url || '',
        permissions: formData.role === 'admin' ? { all: true } : {}
      });
      await fetchUsers();
      setShowAddModal(false);
      showToast('Pengguna baru berhasil ditambahkan!');
    } catch { 
      showToast('Gagal menambahkan pengguna.', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setLogoFile(file);
  };

  const handleSaveBranding = async () => {
    try {
      setSavingSettings(true);
      let logoUrl = settings.logo_url;
      if (logoFile) {
        const formData = new FormData();
        formData.append('image', logoFile);
        const res = await fetch(`${api.url}/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        logoUrl = data.url;
      }
      const updatedSettings = { ...settings, logo_url: logoUrl };
      await api.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      showToast('Branding berhasil diperbarui! Muat ulang halaman.');
    } catch (err) {
      showToast('Gagal menyimpan branding.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const fullSettings = {
        ...settings,
        ai_provider: aiConfig.provider,
        ai_api_key: aiConfig.apiKey,
        is_ai_enabled: aiConfig.isEnabled,
        tier_rules: tierRules
      };

      await api.saveSettings(fullSettings);
      await api.saveSettingsLoyalty(loyaltyConfig);
      
      if (aiConfig.apiKey && aiConfig.apiKey.trim() !== '') {
        localStorage.setItem('ken_ai_config', JSON.stringify(aiConfig));
      } else {
        localStorage.removeItem('ken_ai_config');
      }
      
      showToast('Pengaturan sistem & AI berhasil disimpan!', 'success');
    } catch (err) { 
      const errorMsg = err.message || 'Gagal menyimpan pengaturan.';
      showToast(errorMsg, 'error'); 
    } finally { 
      setSavingSettings(false); 
    }
  };

  const handleBackup = async () => {
    try {
      const [menu, bahan, transactions, tables, customers, suppliers, pos] = await Promise.all([
        api.getMenu(), api.getBahan(), api.getTransactions(),
        api.getTables(), api.getCustomers(), api.getSuppliers(), api.getPO()
      ]);
      const backup = { menu, bahan, transactions, tables, customers, suppliers, purchase_orders: pos, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `brewmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup berhasil diunduh!');
    } catch { 
      showToast('Gagal membuat backup.', 'error'); 
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e?.preventDefault();
    if (!newPayment.account_number || !newPayment.account_name) return alert('Isi data wajib');
    try {
       const newItem = await api.addPaymentMethods(newPayment);
       if(newItem) setPaymentMethods([...paymentMethods, newItem]);
       setShowAddPayment(false);
       setNewPayment({ type: 'manual_transfer', account_number: '', account_name: '', instructions: '' });
       showToast('Metode pembayaran berhasil ditambah!');
    } catch (e) {
       showToast('Gagal menambah metode pembayaran', 'error');
    }
  };

  const handleUpdatePaymentMethod = async (e) => {
     e?.preventDefault();
     try {
       await api.updatePaymentMethods(editingPayment);
       setPaymentMethods(paymentMethods.map(m => m.id === editingPayment.id ? editingPayment : m));
       setEditingPayment(null);
       showToast('Metode pembayaran diperbarui!');
     } catch (e) {
       showToast('Gagal update', 'error');
     }
  };

  const handleDeletePaymentMethod = async (id) => {
     if(!window.confirm('Yakin ingin menghapus metode pembayaran ini?')) return;
     try {
        await api.deletePaymentMethods(id);
        setPaymentMethods(paymentMethods.filter(m => m.id !== id));
        showToast('Terhapus');
     } catch(e) {
        showToast('Gagal menghapus', 'error');
     }
  };

  return {
    user, globalUser, tenant,
    users, setUsers,
    selected, setSelected,
    activeTab, setActiveTab,
    settings, setSettings,
    aiConfig, setAiConfig,
    userSubTab, setUserSubTab,
    userSearchQuery, setUserSearchQuery,
    rolePermissions, setRolePermissions,
    selectedRole, setSelectedRole,
    featureOverrides, setFeatureOverrides,
    loading, setLoading,
    showAddModal, setShowAddModal,
    toast, setToast,
    savingSettings, setSavingSettings,
    logoFile, setLogoFile,
    logoPreview, setLogoPreview,
    loyaltyConfig, setLoyaltyConfig,
    tierRules, setTierRules,
    geofence, setGeofence,
    paymentMethods, setPaymentMethods,
    showAddPayment, setShowAddPayment,
    newPayment, setNewPayment,
    editingPayment, setEditingPayment,
    outlets,
    showToast,
    toggleRolePerm,
    handleSaveUser,
    handleSaveRolePermissions,
    handleDeleteUser,
    handleAddUser,
    handleLogoUpload,
    handleSaveBranding,
    handleSaveSettings,
    handleBackup,
    handleAddPaymentMethod,
    handleUpdatePaymentMethod,
    handleDeletePaymentMethod
  };
}
