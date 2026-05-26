import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Wallet,
  CreditCard,
  History,
  Plus,
  Lock,
  Unlock,
  TrendingUp,
  Printer,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  Receipt,
  QrCode,
  ChevronRight,
  FileDown,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useShiftPage } from '../hooks/useShiftPage';

export default function ShiftPage({ user, onNavigate }) {
  const navigate = useNavigate();

  const {
    isLoading, isError, refetch,
    isAdding, isClosing,
    showOpenModal, setShowOpenModal,
    showCloseModal, setShowCloseModal,
    initialCash, setInitialCash,
    closingCash, setClosingCash,
    closingNotes, setClosingNotes,
    closingCashError, setClosingCashError,
    shifts, activeShift,
    handleOpenShift,
    handleCloseShift,
    generatePDF,
    getKasirName,
    getInitials,
    formatCurrency
  } = useShiftPage({ user });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 font-mono tabular-nums">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-lg animate-spin shadow-lg shadow-amber-500/20"></div>
        <p className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest text-[10px]">
          Mengambil Data Shift...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 font-mono tabular-nums">
        <AlertCircle size={48} className="text-rose-500" />
        <p className="text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest text-[10px]">
          Gagal Memuat Data Shift.
        </p>
        <Button onClick={() => refetch()} variant="outline">Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4 md:px-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in duration-700">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="px-2.5 py-1 border border-amber-500/20 rounded-sm text-[9px] font-black text-amber-500 uppercase tracking-widest">
              Sesi Kerja & POS
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">
                Terminal Operasional
              </span>
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">
            Operasional <span className="text-amber-500 italic">Kasir</span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Kelola sesi kerja kasir, buka/tutup laci kasir, dan audit rekonsiliasi keuangan.
          </p>
        </div>
        {!activeShift && (
          <Button
            onClick={() => setShowOpenModal(true)}
            size="lg"
            className="rounded-lg h-14 px-10 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95"
          >
            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform" /> Buka Shift Baru
          </Button>
        )}
      </div>

      {activeShift ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Active Shift Details */}
          <Card className="lg:col-span-2 overflow-hidden relative group h-full flex flex-col">
            <div className="absolute top-0 right-0 p-12 text-amber-500/20 dark:text-amber-400/10 scale-150 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
              <Unlock size={240} />
            </div>

            <CardContent className="p-8 relative z-10 text-foreground h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-400 rounded-lg flex items-center justify-center shadow-inner">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        Sesi Kasir Aktif
                      </p>
                      <h3 className="text-xl font-black text-foreground">{getKasirName(activeShift)}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      Mulai Sejak
                    </p>
                    <h4 className="text-lg font-black font-mono tabular-nums text-foreground">
                      {new Date(
                        activeShift.openTime || activeShift.startTime || activeShift.created_at
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-6 rounded-lg border border-border shadow-inner">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Wallet size={12} className="text-amber-500 dark:text-amber-400" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Modal Awal
                      </p>
                    </div>
                    <p className="text-xl font-black font-mono tabular-nums text-foreground">
                      {formatCurrency(activeShift.openCash || activeShift.initial_cash)}
                    </p>
                  </div>
                  <div className="bg-background p-6 rounded-lg border border-border shadow-inner">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Receipt size={12} className="text-amber-500 dark:text-amber-400" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Total Transaksi
                      </p>
                    </div>
                    <p className="text-xl font-black font-mono tabular-nums text-foreground">
                      {activeShift.currentSalesCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => (onNavigate ? onNavigate('kasir') : navigate('/kasir'))}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  <LayoutDashboard size={16} className="mr-2" /> Menuju POS
                </Button>
                <Button onClick={() => setShowCloseModal(true)} className="flex-1 h-10 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95">
                  <Lock size={16} className="mr-2" /> Tutup Sesi Shift
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Stats Sidebar */}
          <Card className="h-full relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 text-amber-500/10 dark:text-amber-400/5">
              <TrendingUp size={100} />
            </div>
            <CardContent className="p-8 space-y-8 flex-1">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">
                  Estimasi Kas Laci
                </p>
                <h3 className="text-4xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {formatCurrency(
                    (Number(activeShift.openCash || activeShift.initial_cash) || 0) +
                      (Number(activeShift.currentCash) || 0)
                  )}
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] border-b border-border pb-2">
                  Rincian Penerimaan
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center group text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black">Tunai</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Cash in Drawer</p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      {formatCurrency(activeShift.currentCash || 0)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center group text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                        <QrCode size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black">QRIS / E-Wallet</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Cashless Sales</p>
                      </div>
                    </div>
                    <p className="font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {formatCurrency(activeShift.currentQris || 0)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center group text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-transform group-hover:scale-110">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black">Kartu Debit</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Card Payments</p>
                      </div>
                    </div>
                    <p className="font-black font-mono tabular-nums text-sky-600 dark:text-sky-400">
                      {formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-dashed border-border space-y-1">
                <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                  Total Penjualan Sesi Ini
                </p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {formatCurrency(activeShift.currentSales || activeShift.total_sales || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-32 h-32 bg-card rounded-lg flex items-center justify-center mb-8 relative border-2 border-dashed border-border">
            <Lock className="text-zinc-500 dark:text-zinc-400" size={48} />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-border rounded-lg flex items-center justify-center">
              <AlertCircle size={16} className="text-zinc-500 dark:text-zinc-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mb-2 font-serif">
            Kasir Sedang Terkunci
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-sm text-center leading-relaxed">
            Sistem memerlukan sesi shift aktif untuk memproses transaksi. Silakan buka shift baru untuk memulai operasional hari ini.
          </p>
          <Button onClick={() => setShowOpenModal(true)} className="mt-8 h-14 px-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95">
            Buka Shift Sekarang <Plus className="ml-2" />
          </Button>
        </div>
      )}

      {/* History Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-amber-500 dark:text-amber-400">
              <History size={20} />
            </div>
            <h3 className="text-xl font-black text-foreground font-serif">Log Aktivitas Shift</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} isLoading={isLoading}>
            <RefreshCw size={14} className="mr-2" /> Segarkan
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 border-b border-border">
                  <th className="px-8 py-6">Kasir / Operator</th>
                  <th className="px-8 py-6">Periode Waktu</th>
                  <th className="px-8 py-6">Modal & Penjualan</th>
                  <th className="px-8 py-6">Status Sesi</th>
                  <th className="px-8 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shifts
                  .filter((s) => s?.status !== 'open')
                  .map((s) => (
                    <tr key={s?.id || Math.random()} className="hover:bg-background transition-all duration-300 group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-400 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-inner">
                            {getInitials(getKasirName(s))}
                          </div>
                          <div>
                            <span className="font-black text-sm text-foreground block">
                              {getKasirName(s)}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest font-mono">
                              ID: {String(s?.id || '').slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-black font-mono tabular-nums">
                            <Calendar size={12} className="text-zinc-500 dark:text-zinc-400" />
                            {s?.openTime || s?.start_time || s?.created_at
                              ? new Date(s.openTime || s.start_time || s.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase font-mono tabular-nums">
                            <Clock size={10} />
                            {s?.openTime || s?.start_time || s?.created_at
                              ? new Date(s.openTime || s.start_time || s.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '--'}
                            <span className=" mx-1">→</span>
                            {s?.closeTime
                              ? new Date(s.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '--'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1 font-mono tabular-nums">
                          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase flex justify-between max-w-[120px]">
                            Modal: <span>{formatCurrency(s?.openCash || s?.initial_cash)}</span>
                          </p>
                          <p className="text-sm font-black text-amber-600 dark:text-amber-400 flex justify-between max-w-[120px]">
                            Omzet: <span>{formatCurrency(s?.totalSales || s?.total_sales)}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-background text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 border border-border">
                          {s?.status || 'closed'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generatePDF(s)}
                            title="Download PDF"
                          >
                            <FileDown size={18} />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {shifts.filter((s) => s?.status !== 'open').length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-zinc-500 dark:text-zinc-400 italic font-medium">
                      Belum ada rekaman riwayat shift tersimpan di database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal Buka Shift */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 animate-gradient-x" />
            <CardHeader className="text-center pt-6 pb-2">
              <div className="w-12 h-12 bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-400 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Unlock size={20} strokeWidth={2.5} />
              </div>
              <CardTitle className="text-xl font-black tracking-tight font-serif">Mulai Sesi Shift</CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">
                Inisialisasi Kas Laci
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="initialCash"
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 px-1"
                >
                  Jumlah Modal Awal (Tunai)
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500 dark:text-zinc-400 group-focus-within:text-amber-500 transition-colors text-sm">
                    Rp
                  </span>
                  <Input
                    id="initialCash"
                    name="initialCash"
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="pl-12"
                    placeholder="0"
                    disabled={isAdding}
                  />
                </div>
                <p className="text-[8px] text-zinc-500 dark:text-zinc-400 italic px-1 font-medium">
                  * Masukkan jumlah uang tunai fisik yang ada di laci saat ini.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 px-6 pb-6 pt-0 border-t-0">
              <Button
                variant="outline"
                onClick={() => setShowOpenModal(false)}
                className="flex-1 uppercase tracking-widest text-xs"
                disabled={isAdding}
              >
                Batal
              </Button>
              <Button
                onClick={handleOpenShift}
                className="flex-1 uppercase tracking-widest text-xs bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95"
                isLoading={isAdding}
              >
                {!isAdding && (
                  <>
                    Buka <ChevronRight className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-red-400 to-rose-600 animate-gradient-x" />
            <CardHeader className="text-center pt-6 pb-2 shrink-0">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Lock size={20} strokeWidth={2.5} />
              </div>
              <CardTitle className="text-xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-serif">
                Tutup Sesi Shift
              </CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">
                Rekonsiliasi & Finalisasi
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-4 pt-2 space-y-4 flex-1 min-h-0">
              <div>
                <div className="flex justify-between items-center group font-mono tabular-nums">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sistem (Expected)</span>
                  <span className="text-xs font-black text-foreground">
                    {formatCurrency(
                      (Number(activeShift.openCash || activeShift.initial_cash) || 0) +
                        (Number(activeShift.currentCash) || 0)
                    )}
                  </span>
                </div>
                <div className="pt-2.5 mt-2 border-t border-dashed border-border flex justify-between items-center font-mono tabular-nums">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Omzet Penjualan</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(activeShift.currentSales || activeShift.total_sales || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 mt-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="closingCash"
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 px-1"
                  >
                    Uang Fisik di Laci (Audit)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500 dark:text-zinc-400 group-focus-within:text-rose-500 transition-colors text-sm">
                      Rp
                    </span>
                    <Input
                      id="closingCash"
                      name="closingCash"
                      type="number"
                      value={closingCash}
                      onChange={(e) => {
                        setClosingCash(e.target.value);
                        if (closingCashError) setClosingCashError('');
                      }}
                      className="pl-12"
                      placeholder="0"
                      error={closingCashError}
                      disabled={isClosing}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="closingNotes"
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 px-1"
                  >
                    Catatan Audit (Opsional)
                  </label>
                  <Input
                    id="closingNotes"
                    name="closingNotes"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Contoh: Selisih 500 perak"
                    disabled={isClosing}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="shrink-0 px-6 pb-6 pt-4 border-t border-border bg-card flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingCashError('');
                }}
                className="flex-1 uppercase tracking-widest text-xs"
                disabled={isClosing}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseShift}
                className="flex-1 uppercase tracking-widest text-xs"
                isLoading={isClosing}
              >
                {!isClosing && (
                  <>
                    Tutup <CheckCircle2 className="ml-2" size={16} />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}