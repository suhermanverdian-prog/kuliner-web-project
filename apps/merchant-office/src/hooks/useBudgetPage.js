// ============================================================
// KEN ENTERPRISE — BUDGET PAGE HOOK
// State Management for Budgeting Feature
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function useBudgetPage({ accounts = [] }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [variance, setVariance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subView, setSubView] = useState('input'); // 'input' | 'variance'
  const [editedBudgets, setEditedBudgets] = useState({}); // { [account_id]: { amount, notes } }

  // Filter accounts that can be budgeted (Beban/Expense, Aset/Asset, Kewajiban/Liability)
  const budgetableAccounts = accounts.filter(acc => {
    const cat = (acc.category || '').toLowerCase();
    return ['beban', 'expense', 'aset', 'asset', 'kewajiban', 'liability'].includes(cat);
  });

  // Load budgets from server
  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets({ year: selectedYear, month: selectedMonth });
      const arr = Array.isArray(data) ? data : [];
      setBudgets(arr);

      // Pre-populate editedBudgets with existing data
      const map = {};
      arr.forEach(b => {
        map[b.account_id] = { 
          amount: Number(b.amount), 
          notes: b.notes || '',
          sub_items: b.sub_items || []
        };
      });
      setEditedBudgets(map);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Load variance report
  const loadVariance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBudgetVariance({ year: selectedYear, month: selectedMonth });
      setVariance(data);
    } catch (err) {
      console.error('Failed to load variance:', err);
      setVariance(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Re-fetch when period changes
  useEffect(() => {
    if (subView === 'input') {
      loadBudgets();
    } else {
      loadVariance();
    }
  }, [selectedMonth, selectedYear, subView, loadBudgets, loadVariance]);

  // Update a single budget field in local state
  const updateBudgetField = (accountId, field, value) => {
    setEditedBudgets(prev => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] || { amount: 0, notes: '', sub_items: [] }),
        [field]: value
      }
    }));
  };

  // Save all edited budgets to server (batch)
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const items = budgetableAccounts
        .filter(acc => {
          const edit = editedBudgets[acc.id];
          return edit && (Number(edit.amount) > 0 || (edit.sub_items && edit.sub_items.length > 0));
        })
        .map(acc => {
          const edit = editedBudgets[acc.id];
          return {
            account_id: acc.id,
            account_code: acc.code,
            account_name: acc.name,
            period_month: selectedMonth,
            period_year: selectedYear,
            amount: Number(edit.amount),
            notes: edit.notes || '',
            sub_items: edit.sub_items || []
          };
        });

      if (items.length === 0) {
        alert('Tidak ada anggaran untuk disimpan. Isi minimal satu akun.');
        setSaving(false);
        return;
      }

      await api.request(`${api.url}/accounting/budgets`, 'POST', items);
      await loadBudgets();
      alert('✅ Anggaran berhasil disimpan!');
    } catch (err) {
      console.error('Failed to save budgets:', err);
      alert('❌ Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete a single budget
  const handleDeleteBudget = async (id) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try {
      await api.deleteBudget(id);
      await loadBudgets();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return {
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    budgets, setBudgets,
    variance, setVariance,
    loading,
    saving,
    subView, setSubView,
    editedBudgets, setEditedBudgets,
    budgetableAccounts,
    updateBudgetField,
    handleSaveAll,
    handleDeleteBudget,
    loadBudgets,
    loadVariance,
    MONTH_NAMES
  };
}
