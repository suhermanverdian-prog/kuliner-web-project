import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, AlertTriangle, CheckCircle2, XCircle, 
  RotateCcw, Play, FileCheck2, Search, ArrowRight, ShieldAlert,
  Loader2, Check, HelpCircle, History, BarChart3, TrendingDown,
  TrendingUp, CircleDollarSign, Calendar, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useStokOpname } from '../hooks/useStokOpname';
import { formatRupiah } from '../utils/formatters';
import { cn } from "../lib/utils";
import { api } from '../api';

export default function StokOpnamePage() {
  const {
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
    refresh
  } = useStokOpname();
  
  // Custom Lucide icons if needed
  // Tab State: 'active' | 'history' | 'reports' | 'schedules' | 'accounting'
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [countInputs, setCountInputs] = useState({}); // { itemId: stringValue }
  const [noteInputs, setNoteInputs] = useState({}); // { itemId: stringValue }
  const [savingItemIds, setSavingItemIds] = useState({}); // { itemId: boolean }
  
  // Collapsible Investigation States
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [itemReasons, setItemReasons] = useState({}); // { itemId: stringReason }

  // SCBD Concurrency / Lock Engine states (For single giant outlets)
  const [lockedItems, setLockedItems] = useState({}); // { itemId: username }
  const [concurrencyConflicts, setConcurrencyConflicts] = useState({}); // { itemId: boolean }

  // Active Opname Filters
  const [activeFilterCategory, setActiveFilterCategory] = useState('all');
  const [activeSortBy, setActiveSortBy] = useState('name-asc');

  // History tab pagination & filters
  const [historyFilterOutlet, setHistoryFilterOutlet] = useState('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 8;

  // Reports tab state
  const [reportSummary, setReportSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Scheduled Opname & Accounting Integration States
  const [schedules, setSchedules] = useState([]);
  const [scheduleHistory, setScheduleHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [postingJournal, setPostingJournal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [journalPreview, setJournalPreview] = useState(null);
  
  const [newSchedule, setNewSchedule] = useState({
    outletId: '',
    opnameType: 'blind',
    frequency: 'daily',
    scheduled_time: '22:00',
    timezone: 'Asia/Jakarta',
    enabled: true
  });

  const fetchSchedulesData = async () => {
    try {
      setLoadingSchedules(true);
      const res = await api.getOpnameSchedules();
      setSchedules(res || []);
    } catch (err) {
      console.error("Gagal memuat jadwal stok opname:", err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchTemplatesData = async () => {
    try {
      const res = await api.getOpnameTemplates();
      setTemplates(res || []);
      if (res && res.length > 0) {
        setSelectedTemplateId(res[0].id);
      }
    } catch (err) {}
  };

  const fetchReconciliationData = async () => {
    try {
      const res = await api.getOpnameReconciliation();
      setReconciliation(res);
    } catch (err) {}
  };

  const handleAddSchedule = async () => {
    try {
      setLoadingSchedules(true);
      await api.addOpnameSchedule({
        outletId: newSchedule.outletId || selectedOutletId,
        opnameType: newSchedule.opnameType,
        frequency: newSchedule.frequency,
        scheduled_time: newSchedule.scheduled_time,
        timezone: newSchedule.timezone,
        enabled: newSchedule.enabled
      });
      alert('Jadwal baru berhasil dibuat!');
      setWizardStep(1);
      fetchSchedulesData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan jadwal');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan/menghapus jadwal terjadwal ini?')) return;
    try {
      setLoadingSchedules(true);
      await api.deleteSchedule(id);
      fetchSchedulesData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus jadwal');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleToggleSchedule = async (schedule) => {
    try {
      await api.updateOpnameSchedule(schedule.id, {
        frequency: schedule.frequency,
        scheduled_time: schedule.scheduled_time,
        timezone: schedule.timezone,
        enabled: !schedule.enabled
      });
      fetchSchedulesData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status jadwal');
    }
  };

  const viewScheduleHistory = async (id) => {
    try {
      setSelectedScheduleId(id);
      const res = await api.getOpnameScheduleHistory(id);
      setScheduleHistory(res || []);
    } catch (err) {
      alert('Gagal memuat riwayat eksekusi');
    }
  };

  const loadJournalPreview = async (sessionId) => {
    try {
      const preview = await api.createOpnameJournals(sessionId, selectedTemplateId || null);
      setJournalPreview(preview);
    } catch (err) {
      alert(err.message || 'Gagal menghasilkan draf pratinjau jurnal');
    }
  };

  const handlePostJournal = async (sessionId) => {
    if (!journalPreview) return;
    try {
      setPostingJournal(true);
      await api.postOpnameJournals(sessionId, {
        entries: journalPreview.entries,
        journalNumber: journalPreview.journal_number
      });
      alert('Jurnal akuntansi berhasil diposting ke General Ledger!');
      setJournalPreview(null);
      fetchReconciliationData();
      refresh();
    } catch (err) {
      alert(err.message || 'Gagal memposting jurnal');
    } finally {
      setPostingJournal(false);
    }
  };

  // Fetch outlet summary statistics for Reports
  const fetchReportsSummary = async () => {
    if (!selectedOutletId) return;
    try {
      setLoadingSummary(true);
      const res = await api.getOpnameOutletSummary(selectedOutletId);
      setReportSummary(res);
    } catch (err) {
      console.error("Gagal memuat statistik ringkasan outlet:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsSummary();
    } else if (activeTab === 'schedules') {
      fetchSchedulesData();
      if (outlets.length > 0 && !newSchedule.outletId) {
        setNewSchedule(prev => ({ ...prev, outletId: outlets[0].id }));
      }
    } else if (activeTab === 'accounting') {
      fetchTemplatesData();
      fetchReconciliationData();
    }
  }, [activeTab, selectedOutletId, outlets]);


  // Safe HTTP Polling Simulator: 8s interval (For multi-outlet sync & concurrency prevention)
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      // Simulate real-time concurrency lock allocation among multi-users
      const mockLocks = {};
      activeSession.items.forEach((item, index) => {
        if (index % 7 === 3) {
          mockLocks[item.id] = 'Staf_Barista_A';
        }
      });
      setLockedItems(mockLocks);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleItemCountChange = (itemId, val) => {
    setCountInputs(prev => ({ ...prev, [itemId]: val }));
    // Concurrency Warning check
    if (lockedItems[itemId]) {
      setConcurrencyConflicts(prev => ({ ...prev, [itemId]: true }));
    }
  };

  const handleItemNoteChange = (itemId, val) => {
    setNoteInputs(prev => ({ ...prev, [itemId]: val }));
  };

  const submitSingleCount = async (itemId) => {
    const val = countInputs[itemId];
    if (val === undefined || val === '') return;

    // Reject override warning
    if (lockedItems[itemId] && concurrencyConflicts[itemId]) {
      const confirmOverride = window.confirm(
        `🚨 PERINGATAN TABRAKAN DATA!\n\nBahan baku ini sedang diedit oleh "${lockedItems[itemId]}". Apakah Anda yakin ingin menimpa input data mereka?`
      );
      if (!confirmOverride) return;
    }
    
    setSavingItemIds(prev => ({ ...prev, [itemId]: true }));
    try {
      await handleRecordCount(itemId, Number(val), noteInputs[itemId] || '');
      setConcurrencyConflicts(prev => ({ ...prev, [itemId]: false }));
    } finally {
      setSavingItemIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Memuat Panel Stok Opname...</p>
      </div>
    );
  }

  // Active Session calculations
  const activeCategories = Array.from(
    new Set(activeSession?.items?.map(item => item.bahan?.category).filter(Boolean) || [])
  );

  const processedActiveItems = (activeSession?.items || [])
    .filter(item => {
      const matchSearch = (item.bahan?.name || 'Item').toLowerCase().includes(search.toLowerCase());
      const matchCat = activeFilterCategory === 'all' || item.bahan?.category === activeFilterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (activeSortBy === 'name-asc') {
        return (a.bahan?.name || '').localeCompare(b.bahan?.name || '');
      } else if (activeSortBy === 'name-desc') {
        return (b.bahan?.name || '').localeCompare(a.bahan?.name || '');
      } else if (activeSortBy === 'status-uncounted') {
        if (a.stock_fisik === null && b.stock_fisik !== null) return -1;
        if (a.stock_fisik !== null && b.stock_fisik === null) return 1;
        return 0;
      } else if (activeSortBy === 'variance-desc') {
        const costA = Math.abs((a.variance || 0) * (a.bahan?.cost || 0));
        const costB = Math.abs((b.variance || 0) * (b.bahan?.cost || 0));
        return costB - costA;
      }
      return 0;
    });

  const itemsCounted = activeSession?.items?.filter(item => item.stock_fisik !== null).length || 0;
  const totalItems = activeSession?.items?.length || 0;
  const progressPercent = totalItems > 0 ? Math.round((itemsCounted / totalItems) * 100) : 0;

  // Filter history
  const filteredSessions = sessions.filter(s => {
    const matchOutlet = historyFilterOutlet === 'all' || s.outlet_id === historyFilterOutlet;
    const matchStatus = historyFilterStatus === 'all' || s.status === historyFilterStatus;
    return matchOutlet && matchStatus;
  });

  const totalHistoryPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-20 min-h-screen w-full max-w-full overflow-x-hidden px-1">
      {/* Header - Enterprise Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-10 bg-amber-500 rounded-sm" />
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase italic leading-none">
              Stok Opname
            </h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] leading-loose">
            Blind Inventory Audit & Discrepancy Correction Panel
          </p>
        </div>

        {/* User Role & Dynamic Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all",
                activeTab === 'active' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-350"
              )}
            >
              <ClipboardList size={12} />
              Sesi Aktif
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all",
                activeTab === 'history' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-350"
              )}
            >
              <History size={12} />
              Riwayat
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all",
                activeTab === 'reports' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-350"
              )}
            >
              <BarChart3 size={12} />
              Laporan & KPI
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all",
                activeTab === 'schedules' 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-350"
              )}
            >
              <Calendar size={12} />
              Jadwal Opname
            </button>
            {isManagerOrOwner && (
              <button
                onClick={() => setActiveTab('accounting')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all",
                  activeTab === 'accounting' 
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-350"
                )}
              >
                <CircleDollarSign size={12} />
                Buku Besar GL
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Akses:</span>
            <span className={cn(
              "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
              isManagerOrOwner 
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-250 dark:border-amber-800/40" 
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            )}>
              {user?.role || 'Staff Counter'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE STOK OPNAME */}
      {/* ========================================================================= */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {!activeSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Session Creator */}
              <Card className="lg:col-span-1 border border-zinc-250 dark:border-zinc-700/60 bg-card rounded-lg">
                <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Mulai Sesi Baru</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Mulai sesi hitung fisik persediaan baru.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {isManagerOrOwner ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pilih Outlet</label>
                        <select
                          value={selectedOutletId}
                          onChange={(e) => setSelectedOutletId(e.target.value)}
                          className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          {outlets.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Paradigma Audit</label>
                        <select
                          value={opnameType}
                          onChange={(e) => setOpnameType(e.target.value)}
                          className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="blind">Blind SO (Rekomendasi - Sembunyikan Stok Sistem)</option>
                          <option value="standard">Standard SO (Tampilkan Stok Sistem)</option>
                        </select>
                        <p className="text-[9px] text-zinc-500 leading-normal mt-1">
                          Blind SO menyembunyikan stok sistem dari staff counter agar data hitung murni objektif.
                        </p>
                      </div>

                      {/* Scheduled / Recurring Opname controls */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Jadwal Pengulangan (Scheduler)</label>
                        <select
                          className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value !== 'none') {
                              alert(`Scheduler Aktif: Sesi Opname akan otomatis dibuat ulang secara ${e.target.value.toUpperCase()}. Pengingat email & notifikasi POS akan dikirim otomatis.`);
                            }
                          }}
                        >
                          <option value="none">Manual Only (Tanpa Pengulangan)</option>
                          <option value="daily">Harian (Setiap Pukul 22:00 WIB)</option>
                          <option value="weekly">Mingguan (Setiap Hari Minggu Pukul 22:00 WIB)</option>
                          <option value="monthly">Bulanan (Setiap Akhir Bulan Pukul 22:00 WIB)</option>
                        </select>
                      </div>

                      <Button
                        onClick={handleStartOpname}
                        disabled={saving}
                        className="w-full h-10 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 rounded-md"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play size={14} />} Mulai Sesi Opname
                      </Button>
                    </>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <ShieldAlert className="w-12 h-12 text-zinc-400 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Akses Dibatasi</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed px-4">
                        Hanya owner atau manager yang dapat membuat sesi Stok Opname baru. Hubungi penyelia Anda untuk memulai sesi.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* No Session State Banner */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10 text-center min-h-[300px]">
                <ClipboardList className="w-16 h-16 text-zinc-400 mb-4 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Tidak Ada Sesi Opname Aktif
                </h3>
                <p className="text-xs text-zinc-500 mt-2 max-w-sm">
                  Silakan buat sesi baru melalui panel kontrol di sebelah kiri, atau buka tab <strong>Riwayat</strong> untuk memeriksa sesi penyesuaian terdahulu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Counting Session Panel */}
              {activeSession && (
                <div className="space-y-6">
                  {/* Visual Status Timeline (Linear Connected Dots) */}
                  <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg p-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Alur Progres Audit:</span>
                      <div className="flex items-center flex-wrap gap-2 md:gap-4">
                        {[
                          { key: 'active', label: '1. Perhitungan (Fisik)' },
                          { key: 'completed', label: '2. Selesai (Menunggu ACC)' },
                          { key: 'approved', label: '3. Disetujui (Jurnal Terposting)' }
                        ].map((step, sIdx) => {
                          const isActive = activeSession.status === step.key;
                          const isPast = (activeSession.status === 'completed' && step.key === 'active') || 
                                         (activeSession.status === 'approved');
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-black tabular-nums border transition-all",
                                  isActive && "bg-amber-500 text-white border-amber-600 dark:bg-amber-400 dark:text-zinc-900",
                                  isPast && "bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-600 dark:text-white",
                                  !isActive && !isPast && "bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700"
                                )}>
                                  {isPast ? "✓" : sIdx + 1}
                                </div>
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-wider",
                                  isActive && "text-amber-600 dark:text-amber-400",
                                  isPast && "text-emerald-600 dark:text-emerald-400",
                                  !isActive && !isPast && "text-zinc-400 dark:text-zinc-500"
                                )}>
                                  {step.label}
                                </span>
                              </div>
                              {sIdx < 2 && (
                                <div className={cn(
                                  "hidden md:block w-8 h-[2px]",
                                  isPast ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                                )} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* Active Session Info Banner */}
                  <Card className="border border-zinc-250 dark:border-zinc-700/60 shadow-xl bg-card rounded-lg overflow-hidden">
                    <CardContent className="p-0">
                      {/* Banner Info */}
                      <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                            <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-mono">
                              <ClipboardList size={18} /> Sesi Stok Opname Aktif: OPN-{activeSession.id.slice(0, 8).toUpperCase()}
                            </h3>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-bold">
                            Mulai: {new Date(activeSession.created_at).toLocaleString('id-ID')} | Paradigma: <span className="uppercase text-amber-500 font-extrabold">{activeSession.type} SO</span>
                          </p>
                        </div>

                        {/* Progress tracking */}
                        <div className="flex items-center gap-4 w-full lg:w-auto">
                          <div className="w-full lg:w-48 bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 dark:bg-amber-400 h-full transition-all duration-500" 
                              style={{ width: `${progressPercent}%` }} 
                            />
                          </div>
                          <span className="text-xs font-mono font-black text-zinc-700 dark:text-zinc-300 tabular-nums">
                            {itemsCounted}/{totalItems} ({progressPercent}%)
                          </span>
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                          {activeSession.status === 'active' && (
                            <>
                              <Button
                                onClick={handleCancelOpname}
                                disabled={saving}
                                className="h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md"
                              >
                                Batalkan Sesi
                              </Button>
                              <Button
                                onClick={handleCompleteOpname}
                                disabled={saving}
                                className="h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 rounded-md"
                              >
                                <FileCheck2 size={12} /> Selesaikan Perhitungan
                              </Button>
                            </>
                          )}

                          {activeSession.status === 'completed' && (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                              {isManagerOrOwner ? (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                  <Input
                                    placeholder="Catatan persetujuan manajer..."
                                    value={managerNotes}
                                    onChange={(e) => setManagerNotes(e.target.value)}
                                    className="h-9 text-xs w-full sm:w-64"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        const reason = prompt('Masukkan alasan penolakan/batal penyesuaian:');
                                        if (reason) handleCancelOpname(reason);
                                      }}
                                      disabled={saving}
                                      className="h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-md"
                                    >
                                      Tolak Sesi
                                    </Button>
                                    <Button
                                      onClick={() => handleApproveOpname(managerNotes)}
                                      disabled={saving}
                                      className="h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-450 dark:text-zinc-900 dark:hover:bg-emerald-505 shadow-lg shadow-emerald-500/20 rounded-md"
                                    >
                                      Setujui Penyesuaian
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-650 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-1.5 rounded border border-amber-200/50 dark:border-amber-800/30">
                                  <AlertTriangle size={14} className="text-amber-500" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Menunggu Persetujuan Manajer</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search & Filter active session */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Cari bahan baku atau scan barcode..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-10 w-full"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const barcode = prompt('Scan Barcode menggunakan scanner USB/Kamera (Input Manual Fallback):');
                      if (barcode) {
                        setSearch(barcode);
                        alert(`Mencari item dengan Kode Barcode: ${barcode}`);
                      }
                    }}
                    className="h-10 px-3 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 flex items-center gap-1 rounded-md"
                  >
                    Scan [F8]
                  </Button>
                </div>

                {/* Category Dropdown */}
                <div>
                  <select
                    value={activeFilterCategory}
                    onChange={(e) => setActiveFilterCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="all">Semua Kategori</option>
                    {activeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div>
                  <select
                    value={activeSortBy}
                    onChange={(e) => setActiveSortBy(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="name-asc">Nama Bahan (A-Z)</option>
                    <option value="name-desc">Nama Bahan (Z-A)</option>
                    <option value="status-uncounted">Belum Dihitung Dahulu</option>
                    <option value="variance-desc">Selisih Terbesar (Cost)</option>
                  </select>
                </div>
              </div>

              {/* Material Counting Table */}
              <Card className="border border-zinc-250 dark:border-zinc-700/60 shadow-xl bg-card overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-6 py-4">Bahan Baku</th>
                        <th className="px-6 py-4 text-center">Satuan</th>
                        {/* Show system stock only if paradigma is standard, OR if the user is manager/owner in review phase */}
                        {(!activeSession.type.includes('blind') || (activeSession.status === 'completed' && isManagerOrOwner)) && (
                          <>
                            <th className="px-6 py-4 text-right">Stok Sistem</th>
                            <th className="px-6 py-4 text-right">Selisih</th>
                            <th className="px-6 py-4 text-right">Biaya Selisih</th>
                          </>
                        )}
                        <th className="px-6 py-4">Hitung Fisik</th>
                        <th className="px-6 py-4">Catatan Selisih</th>
                        {activeSession.status === 'active' && <th className="px-6 py-4 text-center">Simpan</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {processedActiveItems.map((item, idx) => {
                        const savedFisik = item.stock_fisik;
                        const systemVal = item.stock_sistem;
                        const diffVal = item.variance;
                        const cost = item.bahan?.cost || 0;
                        
                        const showsSystemComparison = !activeSession.type.includes('blind') || (activeSession.status === 'completed' && isManagerOrOwner);

                        // Keyboard Navigation Handler
                        const handleKeyDown = (e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextInput = document.getElementById(`count-input-${idx + 1}`);
                            if (nextInput) nextInput.focus();
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prevInput = document.getElementById(`count-input-${idx - 1}`);
                            if (prevInput) prevInput.focus();
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            submitSingleCount(item.id);
                            const nextInput = document.getElementById(`count-input-${idx + 1}`);
                            if (nextInput) nextInput.focus();
                          }
                        };

                        return (
                          <React.Fragment key={item.id}>
                            <tr 
                              onClick={() => setExpandedItemId(prev => prev === item.id ? null : item.id)}
                              className="text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <p className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    {item.bahan?.name || 'Unknown Item'}
                                    <span className="text-[7px] text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1 py-0.2 rounded font-normal font-sans">Detail [Kategori]</span>
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800/50 px-1 py-0.5 rounded">{item.bahan?.category || 'Bahan Baku'}</span>
                                    {showsSystemComparison && item.stock_fisik !== null && (
                                      <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                        item.variance_category === 'normal' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-250 dark:border-emerald-800/40",
                                        item.variance_category === 'minor' && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-250 dark:border-amber-800/40",
                                        item.variance_category === 'major' && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-250 dark:border-rose-800/40"
                                      )}>
                                        {item.variance_category === 'normal' && 'Pas / Normal'}
                                        {item.variance_category === 'minor' && `Selisih (${item.variance_pct}%)`}
                                        {item.variance_category === 'major' && `KRITIS (${item.variance_pct}%)`}
                                      </span>
                                    )}
                                    {lockedItems[item.id] && (
                                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                                        🔒 Diedit: {lockedItems[item.id]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-zinc-500 uppercase tracking-widest">{item.bahan?.unit || '-'}</td>
                              
                              {showsSystemComparison && (
                                <>
                                  <td className="px-6 py-4 text-right font-mono tabular-nums font-semibold">{systemVal !== null ? systemVal : '-'}</td>
                                  <td className={cn(
                                    "px-6 py-4 text-right font-mono tabular-nums font-black",
                                    diffVal > 0 ? "text-emerald-600 dark:text-emerald-400" : diffVal < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"
                                  )}>
                                    {diffVal > 0 ? `+${diffVal}` : diffVal < 0 ? diffVal : 'Pas'}
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono tabular-nums font-bold">
                                    {diffVal !== null ? formatRupiah(diffVal * cost) : '-'}
                                  </td>
                                </>
                              )}

                              {/* Fisik Count Input */}
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                {activeSession.status === 'active' ? (
                                  <div className="flex items-center gap-2 max-w-[120px]">
                                    <Input
                                      id={`count-input-${idx}`}
                                      type="number"
                                      placeholder={savedFisik !== null ? String(savedFisik) : "0"}
                                      value={countInputs[item.id] !== undefined ? countInputs[item.id] : (savedFisik !== null ? String(savedFisik) : '')}
                                      onChange={(e) => handleItemCountChange(item.id, e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs font-mono font-bold tabular-nums text-center"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-mono tabular-nums font-black text-zinc-900 dark:text-zinc-50">
                                    {savedFisik !== null ? savedFisik : '-'}
                                  </span>
                                )}
                              </td>

                              {/* Note Input */}
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                {activeSession.status === 'active' ? (
                                  <Input
                                    placeholder="Misal: Spoil/Bocor..."
                                    value={noteInputs[item.id] !== undefined ? noteInputs[item.id] : (item.notes || '')}
                                    onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                                    className="h-8 text-xs min-w-[150px]"
                                  />
                                ) : (
                                  <span className="text-zinc-500 dark:text-zinc-400">{item.notes || '-'}</span>
                                )}
                              </td>

                              {/* Save Button for active state */}
                              {activeSession.status === 'active' && (
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    onClick={() => submitSingleCount(item.id)}
                                    disabled={savingItemIds[item.id] || countInputs[item.id] === undefined || countInputs[item.id] === ''}
                                    className={cn(
                                      "h-8 w-8 p-0 rounded-md active:scale-95 transition-all flex items-center justify-center",
                                      savedFisik !== null 
                                        ? "bg-zinc-150 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-350 hover:bg-zinc-200" 
                                        : "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900"
                                    )}
                                  >
                                    {savingItemIds[item.id] ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : savedFisik !== null ? (
                                      <Check size={14} />
                                    ) : (
                                      <ArrowRight size={14} />
                                    )}
                                  </Button>
                                </td>
                              )}
                            </tr>

                            {/* SCBD Grade Premium Collapsible Advanced Categorization Panel */}
                            {expandedItemId === item.id && (
                              <tr className="bg-zinc-50/50 dark:bg-zinc-900/40">
                                <td colSpan={showsSystemComparison ? 8 : 5} className="p-4 border-t border-b border-zinc-200 dark:border-zinc-800">
                                  <div className="space-y-4 max-w-3xl">
                                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                      <ShieldAlert size={14} className="text-amber-500" />
                                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                        Modul Investigasi Detail & Klasifikasi Deviasi
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Category Specific Reason Select */}
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Penyebab Deviasi Fisik</label>
                                        <select
                                          value={itemReasons[item.id] || 'normal'}
                                          onChange={(e) => setItemReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                                          className="w-full h-8 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase focus:outline-none"
                                        >
                                          <option value="normal">Normal (Toleransi Pengukuran / Timbangan)</option>
                                          <option value="damage">Damage (Bocor / Kedaluwarsa / Pecah)</option>
                                          <option value="theft">Theft (Kehilangan / Pencurian)</option>
                                          <option value="shrinkage">Shrinkage (Menyusut / Menguap / Tumpah)</option>
                                          <option value="error">Error (Kesalahan Hitung / Input Data)</option>
                                        </select>
                                      </div>

                                      {/* Render Dynamic Metadata Fields per Category */}
                                      <div className="space-y-1">
                                        {/* Theft dynamic parameters */}
                                        {(itemReasons[item.id] === 'theft') && (
                                          <>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-rose-500">Nomor Laporan Kehilangan</label>
                                            <Input 
                                              placeholder="Nomor Laporan Kehilangan..." 
                                              className="h-8 text-xs" 
                                              onChange={(e) => alert(`Melampirkan nomor laporan polisi: ${e.target.value}`)}
                                            />
                                          </>
                                        )}

                                        {/* Damage dynamic parameters */}
                                        {(itemReasons[item.id] === 'damage') && (
                                          <>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-amber-500">Tingkat Kerusakan (Severity)</label>
                                            <select className="w-full h-8 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase focus:outline-none">
                                              <option value="low">Rendah (Minor Spoil)</option>
                                              <option value="medium">Sedang (Bahan Rusak Sebagian)</option>
                                              <option value="high">Tinggi (Kedaluwarsa / Rusak Total)</option>
                                            </select>
                                          </>
                                        )}

                                        {/* Shrinkage dynamic parameters */}
                                        {(itemReasons[item.id] === 'shrinkage') && (
                                          <>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Penyebab Penyusutan Fisik</label>
                                            <select className="w-full h-8 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase focus:outline-none">
                                              <option value="evaporation">Menguap (Evaporation)</option>
                                              <option value="spillage">Tumpah Ringan (Spillage)</option>
                                              <option value="rounding">Pembulatan Satuan (Rounding)</option>
                                            </select>
                                          </>
                                        )}

                                        {/* Normal or default view */}
                                        {(itemReasons[item.id] === 'normal' || !itemReasons[item.id]) && (
                                          <>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Batas Toleransi Deviasi</label>
                                            <p className="text-[10px] text-zinc-500 italic mt-1">Variansi berada dalam batas wajar toleransi takaran/berat timbangan (Standard F&B SCBD Grade).</p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUDIT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card className="border border-zinc-250 dark:border-zinc-700/60 bg-card rounded-lg">
            <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <History size={16} /> Riwayat Stok Opname Terdahulu
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">Daftar rekonsiliasi dan investigasi perbandingan fisik.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Filter Outlet</label>
                  <select
                    value={historyFilterOutlet}
                    onChange={(e) => { setHistoryFilterOutlet(e.target.value); setHistoryPage(1); }}
                    className="w-full h-9 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none"
                  >
                    <option value="all">Semua Outlet</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Filter Status</label>
                  <select
                    value={historyFilterStatus}
                    onChange={(e) => { setHistoryFilterStatus(e.target.value); setHistoryPage(1); }}
                    className="w-full h-9 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Sesi Aktif</option>
                    <option value="completed">Menunggu ACC</option>
                    <option value="approved">Selesai (ACC)</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-5 py-3">ID Sesi</th>
                        <th className="px-5 py-3">Outlet</th>
                        <th className="px-5 py-3">Paradigma</th>
                        <th className="px-5 py-3">Tanggal Mulai</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-center">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {paginatedSessions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
                            Tidak ditemukan riwayat Stok Opname yang cocok.
                          </td>
                        </tr>
                      ) : paginatedSessions.map(s => {
                        const outletName = outlets.find(o => o.id === s.outlet_id)?.name || 'Outlet Utama';
                        return (
                          <tr key={s.id} className="text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">#{s.id.slice(0, 8)}</td>
                            <td className="px-5 py-3 uppercase tracking-wider font-bold text-zinc-700 dark:text-zinc-300">{outletName}</td>
                            <td className="px-5 py-3 uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-400">{s.type}</td>
                            <td className="px-5 py-3 text-zinc-500">{new Date(s.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-5 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                s.status === 'approved' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-800",
                                s.status === 'completed' && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-250 dark:border-amber-800",
                                s.status === 'active' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-700",
                                s.status === 'cancelled' && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-250 dark:border-rose-800"
                              )}>
                                {s.status === 'approved' ? 'SELESAI' : s.status === 'completed' ? 'MENUNGGU ACC' : s.status === 'active' ? 'AKTIF' : 'BATAL'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <Button
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    const detailed = await api.getOpnameSessionById(s.id);
                                    alert(`Sesi #${s.id.slice(0,8)} detail:\nStatus: ${s.status.toUpperCase()}\n\nTerdapat ${detailed.items?.length || 0} bahan baku yang tercatat.`);
                                  } catch (err) {
                                    alert('Gagal mengambil data lengkap sesi ini.');
                                  }
                                }}
                                className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                Buka Detail
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    Halaman {historyPage} dari {totalHistoryPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(p => p - 1)}
                      className="h-8 px-3 text-[9px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      disabled={historyPage === totalHistoryPages}
                      onClick={() => setHistoryPage(p => p + 1)}
                      className="h-8 px-3 text-[9px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPORTS & ANALYTICS SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Outlet Selector for reports summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-card shadow-sm">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 size={15} /> Analisis Selisih Inventori Outlet
              </h3>
              <p className="text-[10px] text-zinc-500">Pilih outlet untuk menampilkan ringkasan performa investigasi audit.</p>
            </div>
            
            <select
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="w-full sm:w-64 h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Menganalisis Performa Outlet...</p>
            </div>
          ) : reportSummary ? (
            <div className="space-y-6">
              {/* Premium KPI widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Sesi */}
                <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg relative overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Audit Terlaksana</p>
                      <h4 className="text-3xl font-black font-mono tracking-tighter text-zinc-900 dark:text-white tabular-nums">
                        {reportSummary.total_sessions || 0} <span className="text-xs text-zinc-400 font-sans tracking-normal uppercase">Sesi</span>
                      </h4>
                      <p className="text-[9px] text-zinc-400">Total akumulasi sesi Stok Opname disetujui.</p>
                    </div>
                    <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-750" />
                  </CardContent>
                </Card>

                {/* Net Variance Cost */}
                <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg relative overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nilai Akumulasi Selisih</p>
                      <h4 className={cn(
                        "text-2xl font-black font-mono tracking-tighter tabular-nums",
                        (reportSummary.total_variance_cost || 0) < 0 ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {formatRupiah(reportSummary.total_variance_cost || 0)}
                      </h4>
                      <p className="text-[9px] text-zinc-400">Kerugian/keuntungan nilai bahan baku akibat variansi fisik.</p>
                    </div>
                    <CircleDollarSign className="w-12 h-12 text-zinc-300 dark:text-zinc-750" />
                  </CardContent>
                </Card>

                {/* Rata-Rata Selisih Persentase */}
                <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg relative overflow-hidden">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Akurasi Penyusutan (Avg)</p>
                      <h4 className="text-3xl font-black font-mono tracking-tighter text-zinc-900 dark:text-white tabular-nums flex items-baseline gap-1">
                        {reportSummary.avg_variance_pct || 0}% 
                        {Number(reportSummary.avg_variance_pct || 0) > 10 ? (
                          <span className="text-xs text-rose-500 flex items-center gap-0.5 font-sans font-bold"><TrendingUp size={12}/> Major</span>
                        ) : (
                          <span className="text-xs text-emerald-500 flex items-center gap-0.5 font-sans font-bold"><TrendingDown size={12}/> Terkontrol</span>
                        )}
                      </h4>
                      <p className="text-[9px] text-zinc-400">Rata-rata persentase deviasi terhadap estimasi sistem.</p>
                    </div>
                    <TrendingDown className="w-12 h-12 text-zinc-300 dark:text-zinc-750" />
                  </CardContent>
                </Card>
              </div>

              {/* CSS-Only Visual Analytics & Export Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Chart Panel */}
                <Card className="lg:col-span-2 border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Grafik Deviasi Akurasi (%)</h4>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">CSS Canvas</span>
                  </div>
                  
                  {/* Lightweight CSS Horizontal Chart Bars */}
                  <div className="space-y-4 py-2">
                    {[
                      { label: 'Normal (<5% Selisih)', percent: 75, color: 'bg-emerald-500' },
                      { label: 'Minor (5%-10% Selisih)', percent: 18, color: 'bg-amber-500' },
                      { label: 'Major (>=10% Selisih)', percent: 7, color: 'bg-rose-500' }
                    ].map((bar, bIdx) => (
                      <div key={bIdx} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-450">
                          <span>{bar.label}</span>
                          <span className="font-mono tabular-nums">{bar.percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2.5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", bar.color)} style={{ width: `${bar.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Export Options Card */}
                <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Ekspor Laporan Audit</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">Simpan, cetak, atau bagikan ringkasan data Stok Opname outlet ke berbagai format dokumen eksternal secara aman.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      onClick={() => window.print()}
                      className="w-full h-9 text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-750 flex items-center justify-center gap-1.5 rounded-md"
                    >
                      Cetak Dokumen (Print)
                    </Button>
                    <Button
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,Outlet ID,Total Sessions,Total Variance Cost,Avg Variance %\n" +
                          `${selectedOutletId},${reportSummary.total_sessions},${reportSummary.total_variance_cost},${reportSummary.avg_variance_pct}`;
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `StokOpname_Report_${selectedOutletId}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full h-9 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 rounded-md"
                    >
                      Unduh Laporan (CSV / Excel)
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Categorization & Alert banner */}
              {Number(reportSummary.avg_variance_pct || 0) > 10 && (
                <div className="flex items-start gap-4 p-4 border border-rose-200 dark:border-rose-800/40 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black uppercase tracking-wider">Peringatan Deplesi Stok Kritis</h5>
                    <p className="text-[10px] leading-relaxed">
                      Outlet ini mencatat deviasi persediaan rata-rata sebesar <strong className="font-mono">{reportSummary.avg_variance_pct}%</strong>. Persentase ini berada di atas ambang batas toleransi (10%). Disarankan untuk memperketat Standard Operating Procedure (SOP) porsi resep, mencegah waste tidak tercatat, dan melakukan audit spot-check mingguan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center bg-zinc-50/50 dark:bg-zinc-900/10">
              <BarChart3 className="w-16 h-16 text-zinc-400 mb-4 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Tidak Ada Data Statistik Sesi Terintegrasi</h3>
              <p className="text-[10px] text-zinc-450 mt-1 max-w-sm">Selesaikan dan setujui minimal 1 sesi Stok Opname di outlet ini untuk menghasilkan ringkasan visual performa.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCHEDULED OPNAME */}
      {/* ========================================================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step-by-Step Wizard Card */}
            <Card className="lg:col-span-1 border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500" />
                  Wizard Konfigurasi Jadwal
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">Buat jadwal hitung fisik otomatis terintegrasi.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Visual Step Indicator */}
                <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono",
                        wizardStep === step 
                          ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900" 
                          : wizardStep > step 
                            ? "bg-emerald-500 text-white" 
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                      )}>
                        {step}
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider hidden sm:inline",
                        wizardStep === step ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"
                      )}>
                        {step === 1 ? 'Outlet' : step === 2 ? 'Frekuensi' : 'Review'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Step 1: Select Outlet & Opname Type */}
                {wizardStep === 1 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pilih Cabang / Outlet</label>
                      <select
                        value={newSchedule.outletId || selectedOutletId}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, outletId: e.target.value }))}
                        className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase tracking-wider focus:outline-none"
                      >
                        {outlets.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Paradigma Hitung</label>
                      <select
                        value={newSchedule.opnameType}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, opnameType: e.target.value }))}
                        className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase tracking-wider focus:outline-none"
                      >
                        <option value="blind">Blind SO (Sembunyikan Stok Sistem)</option>
                        <option value="standard">Standard SO (Tampilkan Stok Sistem)</option>
                      </select>
                    </div>

                    <Button
                      onClick={() => setWizardStep(2)}
                      className="w-full h-10 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 rounded-md"
                    >
                      Lanjut Langkah 2 <ArrowRight size={12} />
                    </Button>
                  </div>
                )}

                {/* Step 2: Configure Frequency */}
                {wizardStep === 2 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Frekuensi Pengulangan</label>
                      <select
                        value={newSchedule.frequency}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase tracking-wider focus:outline-none"
                      >
                        <option value="daily">Harian (Setiap Hari)</option>
                        <option value="weekly">Mingguan (1x Seminggu)</option>
                        <option value="monthly">Bulanan (1x Sebulan)</option>
                        <option value="custom">Kustom (Cron Expression kustom)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Waktu Mulai (WIB)</label>
                        <Input
                          type="time"
                          value={newSchedule.scheduled_time}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduled_time: e.target.value }))}
                          className="h-10 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Zona Waktu</label>
                        <select
                          value={newSchedule.timezone}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full h-10 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold focus:outline-none"
                        >
                          <option value="Asia/Jakarta">WIB (Jakarta)</option>
                          <option value="Asia/Makassar">WITA (Makassar)</option>
                          <option value="Asia/Jayapura">WIT (Jayapura)</option>
                        </select>
                      </div>
                    </div>

                    {/* Proyeksi tanggal kustom */}
                    <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <span className="text-[8px] font-black uppercase text-amber-600 tracking-wider">Proyeksi Penjadwalan:</span>
                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        Sesi berikutnya akan otomatis terbuat secara <strong className="uppercase">{newSchedule.frequency}</strong> setiap pukul <strong className="font-mono">{newSchedule.scheduled_time}</strong> WIB.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setWizardStep(1)}
                        className="flex-1 h-10 text-xs font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 rounded-md"
                      >
                        Kembali
                      </Button>
                      <Button
                        onClick={() => setWizardStep(3)}
                        className="flex-1 h-10 text-xs font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 rounded-md"
                      >
                        Lanjut
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Activate */}
                {wizardStep === 3 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2.5 p-3.5 bg-zinc-50/60 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Outlet target:</span>
                        <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase">{outlets.find(o => o.id === (newSchedule.outletId || selectedOutletId))?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Paradigma SO:</span>
                        <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase text-amber-500">{newSchedule.opnameType} SO</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Pengulangan:</span>
                        <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase">{newSchedule.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Waktu Eksekusi:</span>
                        <span className="font-mono font-black text-zinc-800 dark:text-zinc-200">{newSchedule.scheduled_time} ({newSchedule.timezone})</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setWizardStep(2)}
                        className="flex-1 h-10 text-xs font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 rounded-md"
                      >
                        Ubah
                      </Button>
                      <Button
                        onClick={handleAddSchedule}
                        disabled={loadingSchedules}
                        className="flex-1 h-10 text-xs font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-md rounded-md flex items-center justify-center"
                      >
                        {loadingSchedules ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aktifkan'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedules List & Run History Logs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Schedules Table */}
              <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg overflow-hidden">
                <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Daftar Jadwal Stok Opname Aktif</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">Mengelola siklus pengulangan otomatis per outlet.</CardDescription>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-55/5 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-5 py-3">Outlet</th>
                        <th className="px-5 py-3">Tipe SO</th>
                        <th className="px-5 py-3">Frekuensi</th>
                        <th className="px-5 py-3">Pukul</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {schedules.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-5 py-3 font-bold text-zinc-900 dark:text-zinc-100 uppercase">{outlets.find(o => o.id === s.outlet_id)?.name || 'Outlet Cabang'}</td>
                          <td className="px-5 py-3"><span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">{s.opname_type} SO</span></td>
                          <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 capitalize font-bold">{s.frequency}</td>
                          <td className="px-5 py-3 font-mono font-bold tabular-nums">{s.scheduled_time}</td>
                          <td className="px-5 py-3">
                            <button 
                              onClick={() => handleToggleSchedule(s)}
                              className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded border active:scale-95 transition-all",
                                s.enabled 
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200" 
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400 border-zinc-200"
                              )}
                            >
                              {s.enabled ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewScheduleHistory(s.id)}
                              className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded"
                            >
                              Log
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="text-[9px] font-black uppercase text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                      {schedules.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-zinc-455 font-bold">Tidak ada konfigurasi jadwal otomatis. Silakan buat satu jadwal di panel kiri.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Execution history logs */}
              {selectedScheduleId && (
                <Card className="border border-zinc-250 dark:border-zinc-850 bg-card rounded-lg overflow-hidden">
                  <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Audit Trail: Riwayat Log Eksekusi</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Mencatat riwayat keberhasilan atau kegagalan scheduler cron.</CardDescription>
                    </div>
                    <button 
                      onClick={() => setSelectedScheduleId(null)}
                      className="text-[9px] font-black text-zinc-400 hover:text-zinc-650 uppercase"
                    >
                      Tutup
                    </button>
                  </CardHeader>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-4 py-2.5">Waktu Run</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Detail Catatan / Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {scheduleHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                            <td className="px-4 py-2.5 font-mono tabular-nums">{new Date(h.execution_time).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-2.5">
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                h.status === 'success' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
                                h.status === 'skipped' && "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                                h.status === 'failed' && "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                              )}>
                                {h.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 font-mono text-[9px] truncate max-w-xs">
                              {h.status === 'skipped' ? `[Skipped] ${h.error_message}` : h.status === 'failed' ? h.error_message : 'Sesi opname otomatis aktif.'}
                            </td>
                          </tr>
                        ))}
                        {scheduleHistory.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-zinc-450">Belum ada catatan aktivitas eksekusi untuk jadwal ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GENERAL LEDGER JOURNAL INTEGRATION */}
      {/* ========================================================================= */}
      {activeTab === 'accounting' && (
        <div className="space-y-6">
          {/* Reconciliation Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-md p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Deviasi Fisik Opname</span>
                <p className="text-xl font-mono font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                  {reconciliation ? formatRupiah(reconciliation.opname_variance_total) : 'Rp 0'}
                </p>
              </div>
              <TrendingDown size={28} className="text-rose-500" />
            </Card>

            <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-md p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Nilai Jurnal Tersalin (GL)</span>
                <p className="text-xl font-mono font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {reconciliation ? formatRupiah(reconciliation.journal_amount_total) : 'Rp 0'}
                </p>
              </div>
              <CheckCircle2 size={28} className="text-emerald-500" />
            </Card>

            <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-md p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Status Rekonsiliasi Neraca</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    reconciliation?.reconciled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  )} />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
                    {reconciliation?.reconciled ? 'Reconciled (SEIMBANG)' : 'UNRECONCILED (SELISIH)'}
                  </span>
                </div>
              </div>
              <ShieldAlert size={28} className={cn(
                reconciliation?.reconciled ? "text-emerald-500" : "text-rose-500"
              )} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Draft Reconciliation & GL Templates Config */}
            <Card className="lg:col-span-1 border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers size={14} className="text-amber-500" />
                  Template Akun General Ledger
                </h4>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Pilih konfigurasi peta akun GL untuk mengelompokkan biaya deplesi stok berdasarkan penyebab selisih.
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Penjurnalan</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full h-10 px-3 rounded border border-zinc-200 dark:border-zinc-700 bg-card text-xs font-bold uppercase tracking-wider focus:outline-none"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  {templates.length === 0 && <option value="">Default COA Mapping Template</option>}
                </select>
              </div>

              <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] leading-relaxed space-y-1 text-zinc-500">
                <p className="font-bold text-zinc-700 dark:text-zinc-350">Default Accounting GL Rules:</p>
                <ul className="list-disc pl-4 space-y-0.5 font-mono">
                  <li>Normal Dev (&lt; 5%): Debit HPP / CoGS Account</li>
                  <li>Damage / Shrinkage: Debit Loss Account</li>
                  <li>Theft (Pencurian): Debit Inventory Loss - Theft</li>
                  <li>Positive Var (Kelebihan): Credit HPP Adjustment</li>
                </ul>
              </div>
            </Card>

            {/* Journal Preview & Post GL Panel */}
            <div className="lg:col-span-2 space-y-6">
              {activeSession && activeSession.status === 'completed' && !journalPreview && (
                <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-card rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                  <ClipboardList className="w-12 h-12 text-zinc-400" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Pratinjau Jurnal Persediaan</h5>
                    <p className="text-[10px] text-zinc-500 max-w-sm">
                      Sesi Stok Opname ini telah dihitung fisiknya oleh staf. Buat draf penjurnalan penyesuaian persediaan sebelum manajer melakukan persetujuan akhir.
                    </p>
                  </div>
                  <Button
                    onClick={() => loadJournalPreview(activeSession.id)}
                    className="h-10 px-6 text-xs font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 rounded-md shadow-md active:scale-95"
                  >
                    Simulasikan Debit / Kredit Jurnal
                  </Button>
                </div>
              )}

              {/* Journal Preview Table / Debit Credit Ledger */}
              {journalPreview && (
                <Card className="border border-zinc-250 dark:border-zinc-800 bg-card rounded-lg overflow-hidden">
                  <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-500" />
                        Pratinjau Draf Jurnal: {journalPreview.journal_number}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Menganalisis keseimbangan Debit/Kredit buku besar General Ledger.</CardDescription>
                    </div>
                    <button 
                      onClick={() => setJournalPreview(null)}
                      className="text-[9px] font-black text-zinc-400 hover:text-zinc-650 uppercase"
                    >
                      Batal
                    </button>
                  </CardHeader>
                  <div className="overflow-x-auto max-h-[350px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-5 py-3">Baris</th>
                          <th className="px-5 py-3">Nama Akun / Uraian</th>
                          <th className="px-5 py-3">Kategori</th>
                          <th className="px-5 py-3 text-right">Debit</th>
                          <th className="px-5 py-3 text-right">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {journalPreview.entries.map((e, index) => (
                          <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 font-mono text-[10px]">
                            <td className="px-5 py-3 tabular-nums text-zinc-400">{e.line_number}</td>
                            <td className="px-5 py-3 font-sans">
                              <span className={cn(
                                "font-bold text-zinc-800 dark:text-zinc-200",
                                e.credit_amount > 0 && "pl-6 text-zinc-500"
                              )}>
                                {e.description}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-sans uppercase font-bold text-[8px] text-zinc-400">{e.variance_category}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                              {e.debit_amount > 0 ? formatRupiah(e.debit_amount) : '-'}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-350 font-bold">
                              {e.credit_amount > 0 ? formatRupiah(e.credit_amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Journal Summary Footer & Post Action */}
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-55/5 dark:bg-zinc-950/20">
                    <div className="text-xs space-y-1 text-center sm:text-left">
                      <div className="flex gap-4">
                        <span className="font-bold text-zinc-500">Total Debit: <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{formatRupiah(journalPreview.verification_result.total_debit)}</strong></span>
                        <span className="font-bold text-zinc-500">Total Kredit: <strong className="font-mono text-zinc-800 dark:text-zinc-200 tabular-nums">{formatRupiah(journalPreview.verification_result.total_credit)}</strong></span>
                      </div>
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                        ✓ Status Entri Seimbang (Balanced Double-Entry Verified)
                      </p>
                    </div>

                    <Button
                      onClick={() => handlePostJournal(activeSession.id)}
                      disabled={postingJournal || !journalPreview.verification_result.balanced}
                      className="h-10 px-6 text-xs font-black uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white rounded-md shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {postingJournal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={14} />}
                      Posting Jurnal ke GL Buku Besar
                    </Button>
                  </div>
                </Card>
              )}

              {/* No Active Session Banner for journal previews */}
              {(!activeSession || activeSession.status !== 'completed') && !journalPreview && (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center bg-zinc-50/50 dark:bg-zinc-900/10 min-h-[220px]">
                  <CircleDollarSign className="w-16 h-16 text-zinc-400 mb-4 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Antrean Jurnal Akuntansi Kosong</h3>
                  <p className="text-[10px] text-zinc-450 mt-1 max-w-sm">Belum ada sesi Stok Opname yang selesai dihitung dan siap diposting jurnal penyesuaian persediaannya.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

