import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useInventori() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{"name":"Admin"}'));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bahan, setBahan] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpnameMode, setIsOpnameMode] = useState(false);
  const [opnameData, setOpnameData] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inventoryMeta, setInventoryMeta] = useState({ categories: [], packageUnits: [], itemUnits: [] });
  const [metaForm, setMetaForm] = useState({ categories: [], packageUnits: [], itemUnits: [] });
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjItem, setAdjItem] = useState(null);
  const [adjForm, setAdjForm] = useState({ type: 'Pengurangan', reason: 'Waste/Basi', qty: 0 });
  const [isAIEngaged, setIsAIEngaged] = useState(true);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Phase 1: Load essential raw material lists & layouts instantly (Blocking)
      const [bahanData, locData, metaData, whsData] = await Promise.all([
        api.getBahan().catch(err => { console.error('Bahan Load Error:', err); return []; }), 
        api.getLocations().catch(err => { console.error('Locations Load Error:', err); return []; }), 
        api.getInventoryMeta().catch(err => { console.error('Meta Load Error:', err); return { categories: [], units: [] }; }),
        api.getWarehouses().catch(err => { console.error('Warehouses Load Error:', err); return []; })
      ]);
      
      setBahan(bahanData);
      setLocations(locData);
      setWarehouses(whsData);
      
      const initialMeta = {
        categories: (metaData.categories || []).map(c => c.trim().toUpperCase()),
        units: [...new Set((metaData.units || []).map(u => u.trim().toUpperCase()))],
        suppliers: [],
        rawCategories: []
      };
      setInventoryMeta(initialMeta);
      setLoading(false); // <-- UNBLOCK THE USER INTERFACE INSTANTLY! (Perceived 10x Speed boost)
      
      // Phase 2: Lazy background-load heavy non-critical metrics (Non-blocking)
      Promise.all([
        api.getInventoryPredictions().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getInventoryLogs().catch(() => []),
        api.getCategories().catch(() => [])
      ]).then(([predData, supData, logsData, catsData]) => {
        setStockLogs(Array.isArray(logsData) ? logsData.slice(0, 15) : []);
        
        const rawCats = Array.isArray(catsData) ? catsData.map(c => c.name) : [];
        const allCats = [...new Set([...rawCats, ...(metaData.categories || [])])];
        const updatedMeta = {
          categories: allCats.map(c => c.trim().toUpperCase()),
          units: initialMeta.units,
          suppliers: supData,
          rawCategories: Array.isArray(catsData) ? catsData : []
        };
        
        setInventoryMeta(updatedMeta);
        setAiPredictions(Array.isArray(predData) ? predData.slice(0, 3) : []);
        setMetaForm({ 
          categories: updatedMeta.categories, 
          packageUnits: metaData.packageUnits || [], 
          itemUnits: updatedMeta.units,
          suppliers: supData,
          rawCategories: Array.isArray(catsData) ? catsData : []
        });
      }).catch(err => console.warn('⚠️ [LazyLoad Engine] Background load encountered minor timeout/error:', err));

    } catch (e) {
      console.error('❌ [LoadData Exception]:', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      await api.saveBahan(formData);
      await loadData();
      setShowModal(false);
      setEditItem(null);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan data bahan baku');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (name) => {
    try {
      setSaving(true);
      await api.createCategory({ name });
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Gagal menambah kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      setSaving(true);
      await api.deleteCategory(id);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBahan = async (id) => {
    try {
      setSaving(true);
      await api.deleteBahan(id);
      await loadData();
      return true;
    } catch (e) {
      console.error(e);
      alert(e.message || 'Gagal menghapus bahan baku');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAssemble = async (targetBahanId, produceQty) => {
    try {
      setSaving(true);
      const res = await api.assembleInventory({ targetBahanId, produceQty });
      alert(res.message || 'Perakitan berhasil!');
      await loadData();
      return true;
    } catch (e) {
      console.error(e);
      alert(e.message || 'Gagal melakukan perakitan bahan');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustment = async () => {
    try {
      setSaving(true);
      await api.post('/inventory/adjust', {
        bahanId: adjItem.id,
        ...adjForm,
        userName: user.name
      });
      await loadData();
      setShowAdjModal(false);
      setAdjItem(null);
    } catch (e) {
      console.error(e);
      alert('Gagal melakukan penyesuaian stok');
    } finally {
      setSaving(false);
    }
  };

  const handleOpnameSave = async () => {
    try {
      setSaving(true);
      const items = Object.entries(opnameData).map(([id, fisik]) => ({
        id: Number(id),
        fisik: Number(fisik)
      }));
      await api.post('/inventory/opname', { items, userName: user.name });
      await loadData();
      setIsOpnameMode(false);
      setOpnameData({});
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan stok opname');
    } finally {
      setSaving(false);
    }
  };

  const safeBahan = Array.isArray(bahan) ? bahan : [];
  const filtered = safeBahan.filter(b => {
    return (b.name || '').toLowerCase().includes(search.toLowerCase());
  });

  return {
    user,
    search, setSearch,
    showModal, setShowModal,
    editItem, setEditItem,
    saving, setSaving,
    bahan,
    locations,
    loading,
    isOpnameMode, setIsOpnameMode,
    opnameData, setOpnameData,
    showSettingsModal, setShowSettingsModal,
    inventoryMeta,
    metaForm,
    showAdjModal, setShowAdjModal,
    adjItem, setAdjItem,
    adjForm, setAdjForm,
    isAIEngaged, setIsAIEngaged,
    aiPredictions,
    stockLogs,
    loadData,
    openEdit,
    handleSave,
    handleCreateCategory,
    handleDeleteCategory,
    handleDeleteBahan,
    handleAssemble,
    handleAdjustment,
    handleOpnameSave,
    filtered,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId
  };
}
