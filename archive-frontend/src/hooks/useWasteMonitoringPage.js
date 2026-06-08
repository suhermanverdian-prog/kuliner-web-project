import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useWasteMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [topWasteItems, setTopWasteItems] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [bahanList, setBahanList] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ bahanId: '', qty: '', reason: 'Expired' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [wasteData, bahanData, logsData] = await Promise.all([
        api.getInventoryWaste().catch(() => []),
        api.getBahan().catch(() => []),
        api.getInventoryLogs().catch(() => []),
      ]);

      setTopWasteItems(Array.isArray(wasteData) ? wasteData : []);
      setBahanList(Array.isArray(bahanData) ? bahanData : []);
      // Filter hanya log bertipe waste
      const wLogs = (Array.isArray(logsData) ? logsData : [])
        .filter(l => (l.type || '').toLowerCase() === 'waste')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
      setWasteLogs(wLogs);
    } catch (err) {
      console.error('[WasteMonitoring] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hitung statistik NYATA dari data database
  const totalWasteValue = topWasteItems.reduce((s, i) => s + (i.value || 0), 0);
  const totalWasteQty = wasteLogs.length;

  // Loss cause breakdown dari wasteLogs nyata
  const lossCauses = (() => {
    if (wasteLogs.length === 0) return [
      { label: 'Expired / Decay',    val: 0, pct: '0%', color: 'bg-rose-500' },
      { label: 'Spillage / Damage',  val: 0, pct: '0%', color: 'bg-amber-500' },
      { label: 'Theft / Unknown',    val: 0, pct: '0%', color: 'bg-zinc-400' },
      { label: 'Process Waste',      val: 0, pct: '0%', color: 'bg-sky-500' },
    ];

    const reasons = {
      expired:  wasteLogs.filter(l => /expired|kadaluarsa|busuk/i.test(l.reason || l.notes || '')).length,
      spill:    wasteLogs.filter(l => /tumpah|rusak|damage|spillage/i.test(l.reason || l.notes || '')).length,
      unknown:  wasteLogs.filter(l => /hilang|unknown|theft/i.test(l.reason || l.notes || '')).length,
    };
    const process = Math.max(0, wasteLogs.length - reasons.expired - reasons.spill - reasons.unknown);
    const total = wasteLogs.length || 1;

    return [
      { label: 'Expired / Decay',   val: reasons.expired, pct: `${Math.round((reasons.expired / total) * 100)}%`, color: 'bg-rose-500' },
      { label: 'Spillage / Damage', val: reasons.spill,   pct: `${Math.round((reasons.spill   / total) * 100)}%`, color: 'bg-amber-500' },
      { label: 'Theft / Unknown',   val: reasons.unknown, pct: `${Math.round((reasons.unknown / total) * 100)}%`, color: 'bg-zinc-400' },
      { label: 'Process Waste',     val: process,         pct: `${Math.round((process         / total) * 100)}%`, color: 'bg-sky-500' },
    ];
  })();

  const handleReportWaste = () => {
    setReportForm({ bahanId: '', qty: '', reason: 'Expired' });
    setShowReportModal(true);
  };

  const handleSubmitWaste = async () => {
    if (!reportForm.bahanId || !reportForm.qty || Number(reportForm.qty) <= 0) {
      showToast('Lengkapi semua field dengan benar.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await api.request(
        `${api.url}/inventory/waste`,
        'POST',
        { bahanId: reportForm.bahanId, qty: parseFloat(reportForm.qty), reason: reportForm.reason }
      );
      showToast('Waste berhasil dicatat & stok berkurang!', 'success');
      setShowReportModal(false);
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Gagal mencatat waste.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    topWasteItems,
    wasteLogs,
    bahanList,
    totalWasteValue,
    totalWasteQty,
    lossCauses,
    showReportModal,
    setShowReportModal,
    reportForm,
    setReportForm,
    submitting,
    toast,
    handleReportWaste,
    handleSubmitWaste,
    fetchData,
  };
}
