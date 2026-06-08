import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAppStore } from '../store/useAppStore';

export function useBukuBesarPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [period, setPeriod] = useState('30days');
  const [ledgerData, setLedgerData] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = useAppStore(state => state.showToast);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounting/accounts');
      setAccounts(res);
      if (res && res.length > 0 && !selectedAccount) {
        // Auto select first account (preferably cash or sales)
        const cashAcc = res.find(a => a.code === '1-1000') || res[0];
        setSelectedAccount(cashAcc.code);
      }
    } catch (err) {
      showToast('Gagal mengambil data akun', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (accountCode) => {
    if (!accountCode) return;
    try {
      setLoading(true);
      const res = await api.get(`/accounting/ledger/${accountCode}?period=${period}`);
      setLedgerData(res);
    } catch (err) {
      showToast('Gagal memuat buku besar', 'error');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLedger(selectedAccount);
    }
  }, [selectedAccount, period]);

  const filteredAccounts = accounts.filter(a => 
    (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return {
    loading,
    accounts: filteredAccounts,
    selectedAccount,
    setSelectedAccount,
    period,
    setPeriod,
    search,
    setSearch,
    ledgerData
  };
}
