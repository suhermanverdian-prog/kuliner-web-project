import { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from 'sonner';

export function useConsolidatedFinancePage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days'); // today | 7days | 30days
  const [summary, setSummary] = useState(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAccountingSummary({ period });
      setSummary(data);
    } catch (err) {
      console.error('❌ [Finance Fetch Error]:', err);
      toast.error('Gagal mengambil data keuangan konsolidasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const stats = summary?.incomeStatement || {};
  const balance = summary?.balanceSheet || {};

  const outletPerformance = summary?.outletPerformance || [
    { name: 'All Outlets (Consolidated)', revenue: stats.revenue || 0, profit: stats.netProfit || 0, growth: 'Stable' },
  ];

  const dailyTrend = summary?.dailyTrend || [];

  return {
    loading,
    period, setPeriod,
    summary,
    stats,
    balance,
    outletPerformance,
    dailyTrend
  };
}
