import { useState, useEffect } from 'react';
import { api } from '../api';

export function useTaxReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('current_month');

  const loadTaxData = async () => {
    setLoading(true);
    try {
      // Reuse transaction API but focus on tax calculation
      const res = await api.getTransactions();
      setData(res || []);
    } catch (err) {
      console.error("Tax Audit Fail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxData();
  }, [period]);

  const totalSales = data.reduce((acc, tx) => acc + (tx.payment_status === 'paid' ? tx.total : 0), 0);
  const totalTax = data.reduce((acc, tx) => acc + (tx.payment_status === 'paid' ? (tx.tax || 0) : 0), 0);
  const netRevenue = totalSales - totalTax;

  return {
    loading,
    data,
    period, setPeriod,
    totalSales,
    totalTax,
    netRevenue,
    loadTaxData
  };
}
