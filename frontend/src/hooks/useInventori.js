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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bahanData, locData, metaData, predData, supData] = await Promise.all([
        api.getBahan(), 
        api.getLocations(), 
        api.getInventoryMeta(),
        api.getInventoryPredictions().catch(() => []),
        api.getSuppliers().catch(() => [])
      ]);
      setBahan(bahanData);
      setLocations(locData);
      
      const sanitizedMeta = {
        categories: [...new Set((metaData.categories || []).map(c => c.trim().toUpperCase()))],
        units: [...new Set((metaData.units || []).map(u => u.trim().toUpperCase()))]
      };
      
      setInventoryMeta({ ...sanitizedMeta, suppliers: supData });
      setAiPredictions(Array.isArray(predData) ? predData.slice(0, 3) : []);
      setMetaForm({ 
        categories: sanitizedMeta.categories, 
        packageUnits: metaData.packageUnits || [], 
        itemUnits: sanitizedMeta.units,
        suppliers: supData
      });
    } catch (e) {
      console.error(e);
    } finally {
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
    loadData,
    openEdit,
    handleSave,
    handleAdjustment,
    handleOpnameSave,
    filtered
  };
}
