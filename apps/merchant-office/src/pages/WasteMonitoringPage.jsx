import React from 'react';
import { 
  Trash2, AlertTriangle, TrendingDown, 
  RefreshCw, Package, Sparkles, History,
  Scale, Zap, BrainCircuit, Timer,
  X, ChevronRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { formatRupiah } from '../utils/formatters';
import { useWasteMonitoringPage } from '../hooks/useWasteMonitoringPage';

export default function WasteMonitoringPage() {
  const {
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
  } = useWasteMonitoringPage();

  // Metrics dari data nyata – ZERO dummy data
  const wasteMetrics = [
    {
      label: 'Potential Waste Value',
      val: totalWasteValue,
      isRupiah: true,
      trend: 'Slow-Moving Stock',
      icon: Trash2,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30'
    },
    {
      label: 'Slow Moving Items',
      val: `${topWasteItems.length} Items`,
      isRupiah: false,
      trend: 'Perlu Perhatian',
      icon: TrendingDown,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      label: 'Total Waste Logs',
      val: `${totalWasteQty} Entri`,
      isRupiah: false,
      trend: 'Dari Database',
      icon: Timer,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/30'
    },
    {
      label: 'Bahan Terdaftar',
      val: `${bahanList.length} Item`,
      isRupiah: false,
      trend: 'Stok Aktif',
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 animate-spin text-rose-600 dark:text-rose-400" />
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 animate-pulse">
        Fetching Waste Data from Database...
      </p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700 max-w-[1500px] mx-auto min-h-screen">

      {/* Toast */}
      {toast.msg && (
        <div className={cn(
          "fixed top-6 right-6 z-[200] px-6 py-4 rounded-lg shadow-2xl font-black text-sm flex items-center gap-3 animate-in slide-in-from-right duration-300",
          toast.type === 'error'
            ? "bg-rose-500 text-zinc-900"
            : "bg-emerald-500 text-zinc-900"
        )}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-8 p-10 rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-rose-500 rounded-lg flex items-center justify-center shadow-2xl shadow-rose-500/40 rotate-3">
            <Trash2 size={40} strokeWidth={2.5} className="text-zinc-900" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-900 dark:text-zinc-100">
                Zero-Waste <span className="text-rose-600 dark:text-rose-400">Monitoring</span>
              </h1>
              <span className="px-4 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">
                Live DB Feed
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold tracking-widest uppercase">
              Identifikasi kebocoran stok, minimalkan spoilage &amp; optimasi inventori
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-14 px-8 font-black uppercase tracking-widest bg-card border border-border text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
            onClick={() => {
              const el = document.getElementById('waste-logs-history');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <History size={18} className="mr-2 text-rose-600 dark:text-rose-400" /> Waste Logs ({totalWasteQty})
          </Button>
          <Button variant="primary"
            onClick={handleReportWaste}
            className="h-14 px-10 font-black uppercase tracking-widest"
          >
            <AlertTriangle size={18} className="mr-2" /> Report Waste
          </Button>
        </div>
      </header>

      {/* METRICS – semua dari database */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {wasteMetrics.map((s, i) => (
          <Card key={i} className="border border-border bg-card shadow-sm">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-black font-mono tabular-nums leading-none my-1", s.color)}>
                  {s.isRupiah ? formatRupiah(s.val).replace(',00', '') : s.val}
                </p>
                <div className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-500" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">{s.trend}</span>
                </div>
              </div>
              <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center border border-border", s.bg)}>
                <s.icon size={24} className={cn(s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* WASTE LEDGER – data dari DB */}
        <div className="xl:col-span-8 space-y-8">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="p-8 border-b border-border">
              <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-zinc-100">
                Slow-Moving Material Ledger
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Bahan dengan pergerakan lambat — berpotensi waste — diambil dari database
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {topWasteItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Package size={40} className="text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Tidak ada item berisiko waste saat ini
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                    Sistem akan menandai bahan slow-moving secara otomatis
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Material</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Potensi Rugi</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Alasan</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Rekomendasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topWasteItems.map((item, i) => (
                        <tr key={i} className="hover:bg-background transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-[10px] font-black text-rose-600 dark:text-rose-400">
                                {String(i + 1).padStart(2, '0')}
                              </div>
                              <div>
                                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{item.name}</p>
                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{item.qty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                            {formatRupiah(item.value)}
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-background border border-border text-zinc-700 dark:text-zinc-300 rounded text-[10px] font-black uppercase tracking-wide">
                              {item.reason}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-wide">
                              <Zap size={10} fill="currentColor" /> {item.action}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-8 bg-background border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
                Sustainability Ledger &bull; Data Terverifikasi dari Database
              </p>
            </CardFooter>
          </Card>

          {/* WASTE LOG HISTORY – real data */}
          <Card id="waste-logs-history" className="border border-border bg-card shadow-sm">
            <CardHeader className="p-8 border-b border-border">
              <CardTitle className="text-lg font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">
                Riwayat Waste Tercatat
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Log waste yang sudah diinput ke database
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {wasteLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Belum ada log waste tercatat</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Material</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Qty</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Alasan</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {wasteLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-background">
                          <td className="px-8 py-4 font-black text-sm text-zinc-900 dark:text-zinc-100">{log.bahan_name || 'Item'}</td>
                          <td className="px-8 py-4 font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">{Math.abs(log.change_qty)}</td>
                          <td className="px-8 py-4 text-xs text-zinc-500 dark:text-zinc-400">{log.reason || log.notes || '-'}</td>
                          <td className="px-8 py-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                            {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDE WIDGETS */}
        <div className="xl:col-span-4 space-y-8 sticky top-24">
          {/* Loss Causes – dihitung dari data nyata */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="p-8 border-b border-border">
              <CardTitle className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                Loss Causes
              </CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Distribusi penyebab waste dari database
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {lossCauses.map(c => (
                <div key={c.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500 dark:text-zinc-400">{c.label}</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">{c.pct}</span>
                  </div>
                  <div className="h-2 bg-background rounded-lg overflow-hidden">
                    <div className={cn("h-full rounded-lg transition-all duration-1000", c.color)} style={{ width: c.pct }} />
                  </div>
                </div>
              ))}
              {totalWasteQty === 0 && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center italic">
                  Akan dihitung otomatis saat waste dicatat
                </p>
              )}
            </CardContent>
          </Card>

          {/* Zero-Waste Target – data nyata */}
          <div className="p-10 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-950 dark:to-zinc-900 border border-zinc-800/40 rounded-lg shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
            <div className="relative z-10 space-y-6 text-center">
              <div className="w-20 h-20 bg-rose-950/30 border border-rose-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="text-rose-400" size={32} fill="currentColor" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-zinc-100">
                Zero-Waste <span className="text-rose-400 italic">Target</span>
              </h3>
              {totalWasteQty === 0 ? (
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-relaxed">
                  Belum ada data waste tercatat.<br />
                  <span className="text-emerald-400">Mulai catat waste</span> untuk tracking target.
                </p>
              ) : (
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-relaxed">
                  {totalWasteQty} waste log tercatat.{' '}
                  <span className="text-rose-400">
                    {formatRupiah(totalWasteValue).replace(',00', '')}
                  </span>{' '}
                  potensi kerugian teridentifikasi.
                </p>
              )}
              <div className="pt-4">
                <div className="h-4 bg-zinc-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-1000"
                    style={{ width: totalWasteQty === 0 ? '0%' : '100%' }}
                  />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-4">
                  {totalWasteQty === 0 ? 'Belum ada data' : 'Monitoring Aktif'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL REPORT WASTE – proper form, no prompt() */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-800 rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="p-8 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
              <div className="flex justify-between items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">
                    Waste Recording
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    Catat Waste
                  </CardTitle>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-10 h-10 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Pilih Bahan *
                </label>
                <select
                  className="w-full h-12 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={reportForm.bahanId}
                  onChange={e => setReportForm({ ...reportForm, bahanId: e.target.value })}
                >
                  <option value="">-- Pilih bahan --</option>
                  {bahanList.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Stok: {b.stock} {b.unit})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Jumlah Waste *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full h-12 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Masukkan jumlah..."
                  value={reportForm.qty}
                  onChange={e => setReportForm({ ...reportForm, qty: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Alasan Waste *
                </label>
                <select
                  className="w-full h-12 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={reportForm.reason}
                  onChange={e => setReportForm({ ...reportForm, reason: e.target.value })}
                >
                  <option value="Expired">Expired / Kadaluarsa</option>
                  <option value="Rusak">Rusak / Damage</option>
                  <option value="Tumpah">Tumpah / Spillage</option>
                  <option value="Hilang">Hilang / Unknown</option>
                  <option value="Process Waste">Process Waste</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 font-black uppercase tracking-widest"
                onClick={() => setShowReportModal(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button variant="primary"
                className="flex-1 h-12 font-black uppercase tracking-widest"
                onClick={handleSubmitWaste}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Simpan Waste'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
