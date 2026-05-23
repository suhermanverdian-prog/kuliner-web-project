import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const API = api.url;

export function useAkunPage({ user }) {
  const [tab, setTab] = useState('summary');
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJournal, setExpandedJournal] = useState(null);
  const [search, setSearch] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);

  const getHeaders = useCallback(() => {
    const storageStr = localStorage.getItem('ken-enterprise-storage');
    let token = '';
    let tenantId = '';
    
    if (storageStr) {
      try {
        const storage = JSON.parse(storageStr);
        const authData = storage.state?.user;
        if (authData) {
          token = authData.token || '';
          const innerUser = authData.user || authData;
          tenantId = innerUser.tenant_id || '';
        }
      } catch (e) {}
    }

    return { 
      'Content-Type': 'application/json', 
      'Authorization': token ? `Bearer ${token}` : '',
      'x-tenant-id': tenantId 
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, jRes, coaRes] = await Promise.all([
        fetch(`${API}/accounting/summary?period=${period}`, { headers: getHeaders() }),
        fetch(`${API}/accounting/journals`, { headers: getHeaders() }),
        fetch(`${API}/accounting/accounts`, { headers: getHeaders() }),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (jRes.ok) { const d = await jRes.json(); setJournals(Array.isArray(d) ? d : []); }
      if (coaRes.ok) { const d = await coaRes.json(); setAccounts(Array.isArray(d) ? d : []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period, getHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePrint = () => {
    const content = document.getElementById('akun-print-area');
    if (!content) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Laporan Keuangan - KEN ERP</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:6px;text-align:left;} th{background:#6366f1;color:white;} .pos{color:#16a34a;} .neg{color:#dc2626;}</style>
    </head><body>${content.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  const handleExcelExport = () => {
    window.location.href = `${API}/accounting/export/excel?period=${period}`;
  };

  const handleSaveExpense = async (formData) => {
    setSavingExpense(true);
    try {
      const res = await fetch(`${API}/accounting/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({...formData, amount: Number(formData.amount), userName: user?.name})
      });
      if (!res.ok) throw new Error('Gagal simpan');
      setShowExpenseModal(false);
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSavingExpense(false); }
  };

  const is = summary?.incomeStatement || {};
  const bs = summary?.balanceSheet || {};
  const cf = summary?.cashFlow || {};
  const grossMargin = is.revenue > 0 ? ((is.grossProfit / is.revenue) * 100) : 0;
  const netMargin   = is.revenue > 0 ? ((is.netProfit  / is.revenue) * 100) : 0;

  const filteredJournals = journals.filter(j =>
    j.reference?.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase())
  );

  return {
    tab, setTab,
    period, setPeriod,
    summary, setSummary,
    journals, setJournals,
    accounts, setAccounts,
    loading, setLoading,
    expandedJournal, setExpandedJournal,
    search, setSearch,
    showExpenseModal, setShowExpenseModal,
    savingExpense, setSavingExpense,
    loadData,
    handlePrint,
    handleExcelExport,
    handleSaveExpense,
    is, bs, cf,
    grossMargin, netMargin,
    filteredJournals
  };
}
