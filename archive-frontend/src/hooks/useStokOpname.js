import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useStokOpname() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [opnameType, setOpnameType] = useState('blind');

  // Load user from storage
  useEffect(() => {
    const storageStr = localStorage.getItem('ken-enterprise-storage');
    if (storageStr) {
      try {
        const storage = JSON.parse(storageStr);
        const state = storage.state || storage;
        const u = state.user || state;
        if (u) {
          const innerUser = u.user || u;
          setUser({
            ...innerUser,
            role: innerUser.role || 'staff'
          });
        }
      } catch (e) {
        console.error('Failed to parse user state:', e);
      }
    }
    
    // Fallback direct key
    const directUser = localStorage.getItem('user');
    if (directUser) {
      try {
        const u = JSON.parse(directUser);
        setUser(prev => prev || { ...u, role: u.role || 'staff' });
      } catch (e) {}
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOpnameSessions();
      setSessions(Array.isArray(data) ? data : []);
      
      // Check if there is an active session (in_progress or completed awaiting approval)
      const active = data.find(s => s.status === 'in_progress' || s.status === 'completed');
      if (active) {
        const detailed = await api.getOpnameSessionById(active.id);
        setActiveSession(detailed);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to load opname sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOutlets = useCallback(async () => {
    try {
      const data = await api.getOutlets();
      const outletList = Array.isArray(data) ? data : [];
      setOutlets(outletList);
      if (outletList.length > 0) {
        setSelectedOutletId(outletList[0].id);
      }
    } catch (err) {
      console.error('Failed to load outlets:', err);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadOutlets();
  }, [loadSessions, loadOutlets]);

  const handleStartOpname = async () => {
    if (!selectedOutletId) {
      alert("⚠️ Gagal memulai: Silakan pilih Outlet terlebih dahulu. Pastikan server backend berjalan dan memuat data outlet.");
      return;
    }
    try {
      setSaving(true);
      const session = await api.startOpname({
        outletId: selectedOutletId,
        type: opnameType
      });
      await loadSessions();
      return session;
    } catch (err) {
      alert(err.message || 'Gagal memulai sesi Stok Opname');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordCount = async (itemId, count, notes = '') => {
    if (!activeSession) return;
    try {
      setSaving(true);
      await api.recordOpnameCount(activeSession.id, {
        itemId,
        stockFisik: Number(count),
        notes
      });
      
      // Update local state item count
      setActiveSession(prev => {
        if (!prev) return null;
        const updatedItems = prev.items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, stock_fisik: Number(count), notes };
            if (updated.stock_sistem !== undefined) {
              updated.variance = Number(count) - Number(updated.stock_sistem);
            }
            return updated;
          }
          return item;
        });
        return { ...prev, items: updatedItems };
      });
    } catch (err) {
      alert(err.message || 'Gagal merekam jumlah fisik');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteOpname = async () => {
    if (!activeSession) return;
    try {
      setSaving(true);
      await api.completeOpname(activeSession.id);
      await loadSessions();
    } catch (err) {
      alert(err.message || 'Gagal menyelesaikan sesi');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveOpname = async (managerNotes = '') => {
    if (!activeSession) return;
    try {
      setSaving(true);
      await api.approveOpname(activeSession.id, { notes: managerNotes });
      await loadSessions();
      alert('Sesi Stok Opname berhasil disetujui, stok bahan baku diperbarui, dan jurnal penyesuaian telah diposting.');
    } catch (err) {
      alert(err.message || 'Gagal menyetujui sesi opname');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOpname = async () => {
    if (!activeSession) return;
    if (!window.confirm('Apakah Anda yakin ingin membatalkan sesi Stok Opname ini? Semua data hitung fisik akan hilang.')) return;
    try {
      setSaving(true);
      await api.cancelOpname(activeSession.id);
      await loadSessions();
    } catch (err) {
      alert(err.message || 'Gagal membatalkan sesi');
    } finally {
      setSaving(false);
    }
  };

  const isManagerOrOwner = ['owner', 'manager'].includes(user?.role?.toLowerCase());

  return {
    user,
    sessions,
    activeSession,
    loading,
    saving,
    outlets,
    selectedOutletId,
    setSelectedOutletId,
    opnameType,
    setOpnameType,
    isManagerOrOwner,
    handleStartOpname,
    handleRecordCount,
    handleCompleteOpname,
    handleApproveOpname,
    handleCancelOpname,
    refresh: loadSessions
  };
}
