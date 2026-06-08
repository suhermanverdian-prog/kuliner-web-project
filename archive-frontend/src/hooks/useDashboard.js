import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAppStore } from '../store/useAppStore';

export function useDashboard() {
  const { user, settings, tenant, currentOutletId } = useAppStore();
  
  const [transactions, setTransactions] = useState([]);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [pos, setPos] = useState([]);
  const [accountingSummary, setAccountingSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    if (!user) return;

    // PARALLEL DATA ENGINE: High-Concurrency Fetching
    const loadDashboard = async () => {
      try {
        const [tx, mn, tbl, po, inv, acc, low, trnd] = await Promise.all([
          api.getTransactions().catch(() => []),
          api.getMenu().catch(() => []),
          api.getTables().catch(() => []),
          api.getPOs().catch(() => []),
          api.getPurchaseInvoices().catch(() => []),
          api.getAccountingSummary().catch(() => null),
          api.getLowStock().catch(() => []),
          api.getLaporanTrend().catch(() => ({ current: [] }))
        ]);

        setTransactions(tx);
        setMenu(mn);
        setTables(tbl);
        setPos(po);
        setInvoices(inv);
        setAccountingSummary(acc);
        setLowStockItems(low);
        setTrendData(trnd.current || []);
      } catch (err) {
        console.error('Dashboard Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };

    // AI INTELLIGENCE NODE (Parallel Execution)
    const fetchAi = async () => {
      if (settings?.is_ai_enabled && settings?.ai_api_key) {
        try {
          const res = await api.getInventoryPredictions();
          if (res) setAiInsights([{ title: 'PREDICTIVE AI', message: 'Optimasi stok terdeteksi untuk akhir pekan ini.' }]);
        } catch (e) { /* Silent fail for AI */ }
      }
    };

    loadDashboard();
    fetchAi();
  }, [user, currentOutletId, settings]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeMenu = Array.isArray(menu) ? menu : [];

  const today = new Date().toISOString().split('T')[0];
  const getCreatedAt = (t) => t?.created_at || t?.createdAt || '';
  const todayTx = safeTransactions.filter(t => getCreatedAt(t).startsWith(today) && (t?.payment_status === 'paid' || t?.paymentStatus === 'paid'));
  const todayRevenue = todayTx.reduce((s, t) => s + (t?.total || 0), 0);

  const totalUnpaid = invoices.filter(inv => inv.status === 'unpaid').reduce((s, inv) => s + (inv.amount || inv.total || 0), 0);
  const totalSpendMonth = invoices.reduce((s, inv) => s + (inv.amount || inv.total || 0), 0);
  const is = accountingSummary?.incomeStatement || {};

  const occupiedTables = safeTables.filter(t => t.status === 'occupied').length;
  const totalTables = safeTables.length || 1;
  const tableOccupancyPct = Math.round((occupiedTables / totalTables) * 100);

  const activeTx = safeTransactions.filter(t => t.status === 'pending' || t.status === 'preparing');
  const activeOrdersCount = activeTx.length;
  const kitchenLoadPct = Math.round(Math.min((activeOrdersCount / 10) * 100, 100));

  return {
    loading,
    aiInsights,
    lowStockItems,
    tenant,
    trendData,
    safeTransactions,
    safeMenu,
    todayRevenue,
    is,
    totalUnpaid,
    totalSpendMonth,
    occupiedTables,
    totalTables,
    tableOccupancyPct,
    activeOrdersCount,
    kitchenLoadPct
  };
}
