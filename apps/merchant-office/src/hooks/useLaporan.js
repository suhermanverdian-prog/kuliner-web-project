import { useState, useEffect, useCallback } from 'react';
import { printReport, downloadPDF, downloadCSV } from '../utils/reportPrinter';
import api from '../api';

export function useLaporan() {
  const [period, setPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState({ current: [], previous: [] });
  const [payment, setPayment] = useState({ methods: [], total: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [criticalStock, setCriticalStock] = useState([]);
  const [waste, setWaste] = useState({});
  const [insights, setInsights] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [aiInsights, setAiInsights] = useState([]);
  const [features, setFeatures] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrx, setTotalTrx] = useState(0);
  const [loadingTrx, setLoadingTrx] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setFeatures(savedUser.features || {});
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = { period, customStart, customEnd };
      const [s, t, p, tp, cs, w, ins, il] = await Promise.all([
        api.getLaporanSummary(q).catch(() => ({})),
        api.getLaporanTrend(q).catch(() => ({current:[], previous:[]})),
        api.getLaporanPaymentMethods(q).catch(() => ({methods:[], total:0})),
        api.getLaporanTopProducts(q).catch(() => []),
        api.getLaporanCriticalStock().catch(() => []),
        api.getLaporanWaste(q).catch(() => ({})),
        api.getLaporanInsights(q).catch(() => []),
        api.getInventoryLogs().catch(() => []),
      ]);
      
      setSummary(s || {}); 
      setTrend(t || {current:[], previous:[]}); 
      setPayment(p || {methods:[], total:0}); 
      setTopProducts(tp || []);
      setCriticalStock(cs || []); 
      setWaste(w || {}); 
      setInsights(ins || []);
      setInventoryLogs(il || []);

      const aiConfig = JSON.parse(localStorage.getItem('ken_ai_config') || '{"isEnabled":false}');
      if (aiConfig.isEnabled && aiConfig.apiKey) {
        const aiRes = await api.getAiInsights({ provider: aiConfig.provider, apiKey: aiConfig.apiKey }).catch(() => []);
        setAiInsights(aiRes || []);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, [period, customStart, customEnd]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTrx(true);
    try {
      const limit = 10;
      const res = await api.getTransactions({ page: currentPage, limit });
      if (res) {
        // Handle cases where response might be direct array or wrapped object
        const list = Array.isArray(res) ? res : (res.data || []);
        const totalCount = Array.isArray(res) ? res.length : (res.count || list.length);
        setTransactions(list);
        setTotalPages(Math.ceil(totalCount / limit) || 1);
        setTotalTrx(totalCount);
      }
    } catch (e) {
      console.error("Failed to fetch transactions ledger", e);
    } finally {
      setLoadingTrx(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExcel = async (type) => {
    setExporting(true);
    try {
      if (type === 'all') {
        const reportTypes = ['penjualan-harian', 'penjualan-periode', 'inventaris', 'waste', 'hpp', 'laba-rugi'];
        for (const rt of reportTypes) {
          await downloadCSV(rt, period, customStart, customEnd);
        }
      } else {
        await downloadCSV(type, period, customStart, customEnd);
      }
    } catch(err) {
      console.error("Export Excel/CSV error", err);
    } finally { 
      setExporting(false); 
      setShowExport(false); 
    }
  };

  const handlePDF = async (type) => {
    setExporting(true);
    try { 
      await downloadPDF(type, period, customStart, customEnd); 
    } catch(err) {
      console.error("Export PDF error", err);
    } finally { 
      setExporting(false); 
      setShowExport(false); 
    }
  };

  return {
    period, setPeriod,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    loading,
    summary,
    trend,
    payment,
    topProducts,
    criticalStock,
    waste,
    insights,
    inventoryLogs,
    showExport, setShowExport,
    exporting,
    activeTab, setActiveTab,
    aiInsights,
    features,
    transactions, setTransactions,
    currentPage, setCurrentPage,
    totalPages, setTotalPages,
    totalTrx, setTotalTrx,
    loadingTrx, setLoadingTrx,
    handleExcel,
    handlePDF
  };
}
