import { useState, useEffect } from 'react';
import { api } from '../api';

export function usePelangganPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [rewardEnabled, setRewardEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      const formatted = data.map(c => ({
        ...c,
        points: c.points || 0,
        totalSpend: c.totalSpend || 0,
        status: c.status || (c.role === 'customer' ? 'member' : 'guest'),
        joinDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-01-01',
        visits: c.visits !== undefined ? c.visits : 0,
        lastVisit: '2 days ago',
        churnRisk: c.churnRisk || 'High',
        favorites: Array.isArray(c.favorites) && c.favorites.length > 0 ? c.favorites : ['Kyoto Iced Matcha', 'Oat Caramel Macchiato'],
        recommendedAction: c.recommendedAction || 'Kirim promo khusus untuk meningkatkan kunjungan.'
      }));
      setCustomers(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalPoints = customers.reduce((s, c) => s + c.points, 0);
  const totalMembers = customers.filter(c => c.status !== 'guest').length;
  const vipCount = customers.filter(c => c.status === 'vip').length;

  const handleAdd = async () => {
    if (!newForm.name || !newForm.phone) return alert('Nama dan nomor HP wajib diisi!');
    try {
      await api.addCustomers({
        name: newForm.name,
        phone: newForm.phone,
        email: newForm.email,
        password: 'password123',
        role: 'customer',
        points: 0,
        status: 'member'
      });
      await fetchCustomers();
      setShowAddModal(false);
      setNewForm({ name: '', phone: '', email: '' });
    } catch (err) {
      alert('Gagal menambahkan pelanggan');
    }
  };

  return {
    customers,
    search, setSearch,
    selected, setSelected,
    activeTab, setActiveTab,
    rewardEnabled, setRewardEnabled,
    showAddModal, setShowAddModal,
    newForm, setNewForm,
    loading,
    filtered,
    totalPoints,
    totalMembers,
    vipCount,
    handleAdd
  };
}
