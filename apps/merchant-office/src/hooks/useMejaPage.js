import { useState, useEffect } from 'react';
import { api } from '../api';

export function useMejaPage() {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async () => {
    if (newTableName.trim()) {
      await api.saveTable({ name: newTableName, capacity: parseInt(newTableCapacity || 4), status: 'available' });
      setNewTableName('');
      setNewTableCapacity(4);
      setShowAddModal(false);
      fetchTables();
    }
  };

  const changeStatus = async (id, newStatus) => {
    await api.saveTable({ id, status: newStatus });
    if (selected?.id === id) setSelected({ ...selected, status: newStatus });
    fetchTables();
  };
  
  const handleDeleteTable = async (id) => {
    if(confirm('Hapus meja ini?')) {
      await api.deleteTable(id);
      setSelected(null);
      fetchTables();
    }
  };

  const safeTables = Array.isArray(tables) ? tables : [];

  const counts = {
    available: safeTables.filter(t=>t.status==='available').length,
    occupied: safeTables.filter(t=>t.status==='occupied').length,
    reserved: safeTables.filter(t=>t.status==='reserved').length,
  };

  return {
    tables: safeTables,
    selected, setSelected,
    loading,
    showAddModal, setShowAddModal,
    newTableName, setNewTableName,
    newTableCapacity, setNewTableCapacity,
    handleAddTable,
    changeStatus,
    handleDeleteTable,
    counts
  };
}
