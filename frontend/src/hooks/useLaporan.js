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

  const handleExcel = async (type) => {
    setExporting(true);
    try {
      const blob = await api.downloadReportExcel(type, period, customStart, customEnd);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${type}-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
    } catch(err) {
      console.error("Export Excel error", err);
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
