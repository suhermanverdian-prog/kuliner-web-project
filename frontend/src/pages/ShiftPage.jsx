import { useState, useEffect } from 'react';
import { 
  Clock, Wallet, CreditCard, ArrowRight, 
  History, Plus, Lock, Unlock, 
  TrendingUp, Download, Printer, User,
  Calendar, CheckCircle2, AlertCircle, RefreshCw,
  LayoutDashboard, Receipt, QrCode, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from '../api';
import { cn } from "../lib/utils";

const formatCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function ShiftPage({ user, onNavigate }) {
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [initialCash, setInitialCash] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getShifts().catch(() => []);
      const shiftsArray = Array.isArray(data) ? data : [];
      setShifts(shiftsArray);
      const active = shiftsArray.find(s => s?.status === 'open');
      setActiveShift(active || null);
    } catch (err) {
      console.error('Failed to load shifts', err);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenShift = async () => {
    if (!user) return alert('Sesi berakhir, silakan login kembali.');
    const u = user.user || user;
    const uId = u.id || 'unknown';
    const uName = u.name || u.username || 'Kasir';

    try {
      await api.addShift({
        userId: uId,
        userName: uName,
        kasir: uName,
        openTime: new Date().toISOString(),
        openCash: Number(initialCash),
        status: 'open'
      });
      setShowOpenModal(false);
      loadData();
    } catch (err) {
      alert('Gagal membuka shift');
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    try {
      await api.updateShift({
        ...activeShift,
        closeTime: new Date().toISOString(),
        status: 'closed',
        totalSales: activeShift.currentSales || 0,
        totalCash: activeShift.currentCash || 0,
        totalQris: activeShift.currentQris || 0
      });
      setShowCloseModal(false);
      loadData();
    } catch (err) {
      alert('Gagal menutup shift');
    }
  };

  const getKasirName = (s) => s?.userName || s?.kasir || 'Kasir';
  const getInitials = (name) => name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
      <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Menyiapkan Data Shift...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto px-4 md:px-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-muted/50 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <h2 className="text-3xl font-black tracking-tighter text-primary">Operasional Kasir</h2>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Clock size={16} /> Kelola sesi dan laporan harian tim Anda.
          </p>
        </div>
        {!activeShift && (
          <Button 
            onClick={() => setShowOpenModal(true)}
            size="lg"
            className="rounded-[1.5rem] h-14 px-10 shadow-2xl shadow-primary/20 animate-pulse hover:animate-none group"
          >
            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform" /> Buka Shift Baru
          </Button>
        )}
      </div>

      {activeShift ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Active Shift Details */}
          <Card className="lg:col-span-2 overflow-hidden border-none shadow-2xl relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary-dark transition-all duration-500" />
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-1000">
              <Unlock size={240} />
            </div>
            
            <CardContent className="p-10 relative z-10 text-primary-foreground h-full flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-primary-foreground/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-foreground/10 rounded-3xl flex items-center justify-center shadow-inner">
                      <User size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Sesi Kasir Aktif</p>
                      <h3 className="text-2xl font-black">{getKasirName(activeShift)}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Mulai Sejak</p>
                    <h4 className="text-xl font-black">
                      {new Date(activeShift.openTime || activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-primary-foreground/5 backdrop-blur-md p-6 rounded-[2rem] border border-primary-foreground/10 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                      <Wallet size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Modal Awal</p>
                    </div>
                    <p className="text-2xl font-black">{formatCurrency(activeShift.openCash)}</p>
                  </div>
                  <div className="bg-primary-foreground/5 backdrop-blur-md p-6 rounded-[2rem] border border-primary-foreground/10 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                      <Receipt size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Total Transaksi</p>
                    </div>
                    <p className="text-2xl font-black">{activeShift.currentSalesCount || 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => onNavigate('kasir')}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-black"
                >
                  <LayoutDashboard size={20} className="mr-2" /> Menuju POS
                </Button>
                <Button 
                  onClick={() => setShowCloseModal(true)}
                  className="flex-1 h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black shadow-2xl"
                >
                  <Lock size={20} className="mr-2" /> Tutup Sesi Shift
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Stats Sidebar */}
          <Card className="border-none shadow-2xl bg-card/70 backdrop-blur-xl h-full border-t-4 border-accent relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp size={100} />
             </div>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Estimasi Kas Laci</p>
                   <h3 className="text-4xl font-black text-primary">
                     {formatCurrency((Number(activeShift.openCash) || 0) + (Number(activeShift.currentCash) || 0))}
                   </h3>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b pb-2">Rincian Penerimaan</p>
                   
                   <div className="space-y-4">
                      <div className="flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                               <Wallet size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black">Tunai</p>
                               <p className="text-[10px] text-muted-foreground font-medium">Cash in Drawer</p>
                            </div>
                         </div>
                         <p className="font-black text-emerald-600">{formatCurrency(activeShift.currentCash || 0)}</p>
                      </div>

                      <div className="flex justify-between items-center group text-primary">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                               <QrCode size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black">QRIS / E-Wallet</p>
                               <p className="text-[10px] text-muted-foreground font-medium">Cashless Sales</p>
                            </div>
                         </div>
                         <p className="font-black">{formatCurrency(activeShift.currentQris || 0)}</p>
                      </div>

                      <div className="flex justify-between items-center group text-muted-foreground opacity-60">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110">
                               <CreditCard size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black">Kartu Debit</p>
                               <p className="text-[10px] text-muted-foreground font-medium">Card Payments</p>
                            </div>
                         </div>
                         <p className="font-black">{formatCurrency(0)}</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-dashed space-y-1">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Penjualan Sesi Ini</p>
                   <p className="text-2xl font-black text-primary">{formatCurrency(activeShift.currentSales || 0)}</p>
                </div>
             </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-32 h-32 bg-muted/20 rounded-[3rem] flex items-center justify-center mb-8 relative border-2 border-dashed border-muted-foreground/30">
              <Lock className="text-muted-foreground/50" size={48} />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-muted-foreground/30 rounded-full flex items-center justify-center">
                 <AlertCircle size={16} className="text-muted-foreground" />
              </div>
           </div>
           <h3 className="text-2xl font-black text-primary mb-2">Kasir Sedang Terkunci</h3>
           <p className="text-muted-foreground font-medium max-w-sm text-center leading-relaxed">
             Sistem memerlukan sesi shift aktif untuk memproses transaksi. Silakan buka shift baru untuk memulai operasional hari ini.
           </p>
           <Button 
             onClick={() => setShowOpenModal(true)}
             className="mt-8 h-14 px-12 rounded-2xl font-black shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90"
           >
             Buka Shift Sekarang <Plus className="ml-2" />
           </Button>
        </div>
      )}

      {/* History Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-muted-foreground/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-primary">
              <History size={20} />
            </div>
            <h3 className="text-xl font-black text-primary">Log Aktivitas Shift</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="rounded-xl font-bold opacity-60 hover:opacity-100">
             <RefreshCw size={14} className="mr-2" /> Segarkan
          </Button>
        </div>

        <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm overflow-hidden rounded-[2.5rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 border-b">
                  <th className="px-8 py-6">Kasir / Operator</th>
                  <th className="px-8 py-6">Periode Waktu</th>
                  <th className="px-8 py-6">Modal & Penjualan</th>
                  <th className="px-8 py-6">Status Sesi</th>
                  <th className="px-8 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/30">
                {Array.isArray(shifts) && shifts.filter(s => s?.status !== 'open').map((s) => (
                  <tr key={s?.id || Math.random()} className="hover:bg-muted/10 transition-all duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-inner">
                          {getInitials(getKasirName(s))}
                        </div>
                        <div>
                          <span className="font-black text-sm text-primary block">{getKasirName(s)}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">ID: {String(s?.id || '').slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-black">
                          <Calendar size={12} className="text-muted-foreground" />
                          {s?.openTime ? new Date(s.openTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase">
                          <Clock size={10} />
                          {s?.openTime ? new Date(s.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} 
                          <span className="opacity-30 mx-1">→</span>
                          {s?.closeTime ? new Date(s.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between max-w-[120px]">Modal: <span>{formatCurrency(s?.openCash)}</span></p>
                        <p className="text-sm font-black text-primary flex justify-between max-w-[120px]">Omzet: <span>{formatCurrency(s?.totalSales)}</span></p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-[10px] font-black uppercase text-muted-foreground border">
                        {s?.status || 'closed'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <Printer size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(shifts) || shifts.filter(s => s?.status !== 'open').length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-muted-foreground/50 italic font-medium">
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
          <Card className="w-full max-w-md shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 rounded-[3rem] border-none overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
            <CardHeader className="text-center pt-12 pb-6">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Unlock size={36} strokeWidth={2.5} />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">Mulai Sesi Shift</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] mt-2">Inisialisasi Kas Laci</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-10">
              <div className="space-y-3">
                <label htmlFor="initialCash" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Jumlah Modal Awal (Tunai)</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground group-focus-within:text-primary transition-colors text-lg">Rp</span>
                  <Input 
                    id="initialCash"
                    name="initialCash"
                    type="number" 
                    value={initialCash} 
                    onChange={e => setInitialCash(e.target.value)}
                    className="pl-14 h-16 text-2xl font-black rounded-3xl bg-muted/30 border-none focus-visible:bg-background focus-visible:ring-primary shadow-inner"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic px-2 font-medium">* Masukkan jumlah uang tunai fisik yang ada di laci saat ini.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setShowOpenModal(false)} className="flex-1 h-14 rounded-2xl font-black opacity-60 hover:opacity-100">Batal</Button>
                <Button onClick={handleOpenShift} className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20">
                  Konfirmasi & Buka <ChevronRight className="ml-1" size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 rounded-[3rem] border-none overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-destructive via-red-400 to-destructive animate-gradient-x" />
            <CardHeader className="text-center pt-12 pb-6">
              <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock size={36} strokeWidth={2.5} />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-destructive">Tutup Sesi Shift</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] mt-2">Rekonsiliasi & Finalisasi</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="bg-muted/30 rounded-[2rem] p-8 space-y-5 border border-muted/50 shadow-inner">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Total Tunai</span>
                  <span className="font-black text-primary">{formatCurrency(activeShift.currentCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Total QRIS</span>
                  <span className="font-black text-primary">{formatCurrency(activeShift.currentQris || 0)}</span>
                </div>
                <div className="pt-5 border-t border-dashed flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Total Penjualan</span>
                  <span className="text-2xl font-black text-primary">{formatCurrency(activeShift.currentSales || 0)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setShowCloseModal(false)} className="flex-1 h-14 rounded-2xl font-black opacity-60 hover:opacity-100">Kembali</Button>
                <Button onClick={handleCloseShift} className="flex-[2] h-14 bg-destructive hover:bg-destructive/90 text-white rounded-2xl font-black shadow-xl shadow-destructive/20 transition-all active:scale-95">
                  Tutup & Cetak Laporan <CheckCircle2 className="ml-2" size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}