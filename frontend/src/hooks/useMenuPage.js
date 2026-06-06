import { useState, useEffect } from 'react';
import { api } from '../api';

export function getConversion(bahan) {
  if (!bahan) return { ratio: 1, unit: '' };
  if (bahan.storageType === 'Kemasan') {
    const itemsCount = Number(bahan.packageItemsCount) || 1;
    const vol = Number(bahan.packageItemVolume) || 1;
    const volUnit = (bahan.packageItemVolumeUnit || '').toLowerCase();
    if (volUnit === 'ml' || volUnit === 'gr' || volUnit === 'gram') {
      return { ratio: itemsCount * vol, unit: volUnit === 'gr' ? 'Gram' : 'ml' };
    } else {
      return { ratio: itemsCount, unit: bahan.packageItemUnit || 'Pcs' };
    }
  } else {
    const u = (bahan.unit || '').toLowerCase();
    if (u === 'kg' || u === 'kilogram') return { ratio: 1000, unit: 'Gram' };
    if (u === 'liter' || u === 'l') return { ratio: 1000, unit: 'ml' };
    return { ratio: 1, unit: bahan.unit };
  }
}

export function useMenuPage() {
  const [menus, setMenus] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, b] = await Promise.all([
        api.getMenu().catch(err => { console.error('Menu Error:', err); return []; }),
        api.getBahan().catch(err => { console.error('Bahan Error:', err); return []; })
      ]);

      const augmentedMenus = (m || []).map(menu => {
        const cost = (menu.bom || []).reduce((sum, row) => {
          const bahan = (b || []).find(x => String(x.id) === String(row.bahanId || row.bahan_id));
          if (!bahan) return sum;
          const conv = getConversion(bahan);
          const materialCost = bahan.cost || bahan.price || 0;
          return sum + (materialCost / conv.ratio) * Number(row.qty || row.qty_needed || 0);
        }, 0);
        return { ...menu, cost };
      });

      setMenus(augmentedMenus); 
      setBahanList(b || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if(confirm('Hapus produk ini?')) {
      await api.deleteMenu(id);
      loadData();
    }
  };

  const handleSave = async (data) => {
    try {
      const payload = {
        name: data.name,
        price: Number(data.price || 0),
        image: data.image || null,
        sku: data.sku || null,
        category: data.category || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        skip_kds: data.skip_kds === true,
        bom: (data.bom || [])
          .filter(b => b.bahanId || b.bahan_id)
          .map(b => ({
            bahan_id: b.bahanId || b.bahan_id,
            qty: Number(b.qty || 0)
          }))
      };

      if (data.id) {
        await api.updateMenu(data.id, payload);
      } else {
        await api.addMenu(payload);
      }
      await loadData();
      setShowModal(false);
    } catch (err) {
      alert("Gagal menyimpan produk: " + err.message);
    }
  };

  const filtered = menus.filter(m => (category === 'Semua' || m.category === category) && m.name.toLowerCase().includes(search.toLowerCase()));

  return {
    menus, setMenus,
    bahanList, setBahanList,
    loading, setLoading,
    search, setSearch,
    category, setCategory,
    showModal, setShowModal,
    editItem, setEditItem,
    viewMode, setViewMode,
    loadData,
    handleDelete,
    handleSave,
    filtered
  };
}
