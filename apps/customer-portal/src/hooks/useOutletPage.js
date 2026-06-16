import { useState, useEffect } from 'react';
import { api } from '../api';

export function useOutletPage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const data = await api.getOutlets();
      setOutlets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await api.updateOutlet({ ...formData, id: editingOutlet.id });
      } else {
        await api.addOutlet(formData);
      }
      setShowModal(false);
      setEditingOutlet(null);
      setFormData({ name: '', address: '', phone: '', is_active: true });
      fetchOutlets();
    } catch (err) {
      alert('Gagal menyimpan data outlet');
    }
  };

  const handleEdit = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      address: outlet.address || '',
      phone: outlet.phone || '',
      is_active: outlet.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menonaktifkan atau menghapus node outlet ini?')) {
      try {
        const response = await api.deleteOutlet(id);
        if (response && response.message) {
          alert(response.message);
        }
        fetchOutlets();
      } catch (err) {
        console.error('Failed to delete outlet:', err);
        alert(err.message || 'Gagal menghapus outlet');
      }
    }
  };

  const filtered = outlets.filter(o => (o.name || '').toLowerCase().includes(search.toLowerCase()));

  return {
    outlets,
    loading,
    showModal, setShowModal,
    editingOutlet, setEditingOutlet,
    search, setSearch,
    formData, setFormData,
    handleSubmit,
    handleEdit,
    handleDelete,
    filtered
  };
}
