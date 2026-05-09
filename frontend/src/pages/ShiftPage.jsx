import { useState, useEffect } from 'react';
import { 
  Clock, Wallet, CreditCard, ArrowRight, 
  History, Plus, Lock, Unlock, 
  TrendingUp, Download, Printer, User,
  Calendar, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from '../api';

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
      const data = await api.getShifts();
      const shiftsArray = Array.isArray(data) ? data : [];
      setShifts(shiftsArray);
      
      // Cari shift aktif (status === 'open')
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
    
    // Normalisasi data user
    const u = user.user || user;
    const uId = u.id || 'unknown';
    const uName = u.name || u.username || 'Kasir';

    try {
      await api.addShift({
        userId: uId,
        userName: uName, // Gunakan userName untuk konsistensi baru
        kasir: uName,    // Tetap kirim kasir untuk kompatibilitas data lama
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

  // Helper untuk mendapatkan nama kasir dari berbagai kemungkinan field
  const getKasirName = (s) => s?.userName || s?.kasir || 'Kasir';

  const getInitials = (name) => {
    if (!name) return '??';
    return String(name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary">Manajemen Shift</h2>
          <p className="text-muted-foreground mt-1 font-medium">Kelola sesi kasir dan rekonsiliasi harian.</p>
        </div>
        {!activeShift && (
          <Button 
            onClick={() => setShowOpenModal(true)}
            className="bg-primary hover:bg-primary-dark text-white font-black px-8 h-12 rounded-2xl shadow-xl shadow-primary/20 gap-2"
          >
            <Plus size={20} /> Buka Shift Baru
          </Button>
        )}
      </div>

      {activeShift ? (
        <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Unlock size={120} />
          </div>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-foreground/10 rounded-2xl flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-70">Kasir Aktif</p>
                    <h3 className="text-xl font-black">{getKasirName(activeShift)}</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary-foreground/5 p-4 rounded-2xl border border-primary-foreground/10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Waktu Mulai</p>
                    <p className="text-lg font-black">
                      {activeShift.startTime ? new Date(activeShift.startTime).toLocaleTimeString() : 
                       activeShift.openTime ? new Date(activeShift.openTime).toLocaleTimeString() : '--:--'}
                    </p>
                  </div>
                  <div className="bg-primary-foreground/5 p-4 rounded-2xl border border-primary-foreground/10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Modal Awal</p>
                    <p className="text-lg font-black">{formatCurrency(activeShift.openCash)}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-primary-foreground/5 rounded-3xl p-8 border border-primary-foreground/10 backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Estimasi Kas di Laci</p>
                <h4 className="text-4xl font-black mb-6">{formatCurrency((Number(activeShift.openCash) || 0) + (Number(activeShift.currentCash) || 0))}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-bold">Total Penjualan</span>
                    <span className="font-black">{formatCurrency(activeShift.currentSales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-bold">Penjualan Tunai</span>
                    <span className="font-black">{formatCurrency(activeShift.currentCash || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-bold">Penjualan QRIS</span>
                    <span className="font-black">{formatCurrency(activeShift.currentQris || 0)}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowCloseModal(true)}
                  className="w-full mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-black h-12 rounded-2xl gap-2 shadow-xl"
                >
                  <Lock size={18} /> Tutup Shift
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted bg-muted/5 p-12 text-center">
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-muted-foreground">Tidak Ada Shift Aktif</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Silakan buka shift baru untuk mulai melayani pelanggan di kasir.</p>
          <Button 
            onClick={() => setShowOpenModal(true)}
            variant="outline"
            className="mt-6 border-primary text-primary hover:bg-primary/5 font-black px-8 h-11 rounded-xl"
          >
            Buka Shift Sekarang
          </Button>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <History className="text-primary" size={24} />
          <h3 className="text-xl font-black">Riwayat Shift</h3>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b">
                  <th className="px-6 py-4">Kasir</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Modal</th>
                  <th className="px-6 py-4">Total Penjualan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shifts.filter(s => s?.status !== 'open').map((s) => (
                  <tr key={s?.id || Math.random()} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-xs">
                          {getInitials(getKasirName(s))}
                        </div>
                        <span className="font-bold text-sm">{getKasirName(s)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">
                          {s?.startTime ? new Date(s.startTime).toLocaleDateString() : 
                           s?.openTime ? new Date(s.openTime).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">
                          {(s?.startTime || s?.openTime) ? new Date(s?.startTime || s?.openTime).toLocaleTimeString() : '--'} - {(s?.endTime || s?.closeTime) ? new Date(s?.endTime || s?.closeTime).toLocaleTimeString() : '--'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-muted-foreground">
                      {formatCurrency(s?.openCash)}
                    </td>
                    <td className="px-6 py-4 font-black text-sm text-primary">
                      {formatCurrency(s?.totalSales)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-muted text-[10px] font-black uppercase text-muted-foreground">
                        {s?.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="group-hover:text-primary">
                        <Printer size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {shifts.filter(s => s?.status !== 'open').length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground font-medium">
                      Belum ada riwayat shift tersimpan.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Unlock size={32} />
              </div>
              <CardTitle className="text-2xl font-black">Buka Shift Baru</CardTitle>
              <CardDescription>Masukkan jumlah modal awal di dalam laci kasir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Modal Awal (Tunai)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">Rp</span>
                  <Input 
                    type="number" 
                    value={initialCash} 
                    onChange={e => setInitialCash(e.target.value)}
                    className="pl-12 h-14 text-xl font-black rounded-2xl border-2 focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowOpenModal(false)} className="flex-1 h-12 rounded-2xl font-black">Batal</Button>
                <Button onClick={handleOpenShift} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-lg">Mulai Shift</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <CardTitle className="text-2xl font-black text-destructive">Tutup Shift</CardTitle>
              <CardDescription>Ringkasan penjualan sesi ini akan disimpan.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Tunai</span>
                  <span className="font-black">{formatCurrency(activeShift.currentCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest opacity-60">Total QRIS</span>
                  <span className="font-black">{formatCurrency(activeShift.currentQris || 0)}</span>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-widest text-primary">Total Penjualan</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(activeShift.currentSales || 0)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowCloseModal(false)} className="flex-1 h-12 rounded-2xl font-black">Batal</Button>
                <Button onClick={handleCloseShift} className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-white rounded-2xl font-black shadow-lg shadow-destructive/20">Konfirmasi Tutup</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}