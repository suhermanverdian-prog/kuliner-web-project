import { useState, useEffect } from 'react';
import { MENU_CATEGORIES, formatRupiah } from '../data';
import { api } from '../api';
import { 
  ShoppingCart, Search, Info, CheckCircle2, 
  Wallet, CreditCard, Banknote, Landmark, 
  Trash2, Plus, Minus, X, ChevronRight, 
  ArrowLeft, Clock, Bike, Coffee, Star,
  ShoppingBag, Filter, Layers, Receipt, Lock,
  Zap, ArrowRight, User, MapPin, 
  ChevronDown, History, AlertCircle,
  Smartphone, Monitor, Package,
  Sparkles, Check, MoreVertical, SearchX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/Sheet";
import { cn } from "../lib/utils";

// Modal Konfirmasi Pembayaran
function ConfirmPaymentModal({ tx, onClose, onSuccess }) {
  const [cashReceived, setCashReceived] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = tx.total;
  const cashNum = Number(String(cashReceived).replace(/[^0-9]/g, '')) || 0;
  const change = cashNum - total;
  const isCash = tx.paymentMethod === 'Tunai';
  const isReadyToPay = isCash ? cashNum >= total : confirmed;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.confirmPayment(tx.id, {
        cashReceived: isCash ? cashNum : total,
        change: isCash ? change : 0,
        paymentMethod: tx.paymentMethod
      });
      onSuccess(res);
    } catch (e) {
      alert('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 border-none rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-6 border-b bg-muted/10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                   <ShoppingCart size={20} />
                </div>
                <div>
                   <CardTitle className="text-base font-black">Keranjang Pesanan</CardTitle>
                   <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                     {activeShift ? `Shift Aktif: #${activeShift.id.toString().slice(-4)}` : 'Shift Belum Dibuka'}
                   </CardDescription>
                </div>
             </div>
             {activeShift && (
               <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-destructive hover:bg-destructive/10 border border-destructive/20" onClick={handleCloseShift}>
                 <Lock size={12} className="mr-1" /> Tutup Shift
               </Button>
             )}
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="bg-muted/30 rounded-[2rem] p-6 space-y-4 border border-dashed border-muted-foreground/20">
            {tx.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{item.qty}x <span className="text-primary font-bold">{item.name}</span></span>
                <span className="font-black text-primary">{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-muted flex justify-between items-center">
              <span className="font-black text-sm uppercase tracking-widest text-muted-foreground">Total Tagihan</span>
              <span className="font-black text-3xl text-accent">{formatRupiah(total)}</span>
            </div>
          </div>

          {isCash ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center block">Masukkan Uang Diterima</label>
                <div className="relative group">
                   <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground/30 group-focus-within:text-accent transition-colors">Rp</span>
                   <input
                     type="text"
                     className="w-full h-20 bg-muted/20 border-2 border-transparent focus:border-accent focus:bg-background rounded-[2rem] text-4xl font-black text-center focus:ring-0 placeholder:text-muted/50 transition-all shadow-inner pl-16"
                     value={cashNum > 0 ? cashNum.toLocaleString('id-ID') : ''}
                     onChange={e => setCashReceived(e.target.value.replace(/[^0-9]/g, ''))}
                     placeholder="0"
                     autoFocus
                   />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[total, 50000, 100000, 200000].map(amt => (
                  <Button 
                    key={amt} variant={cashNum === amt ? "default" : "outline"} 
                    className={cn(
                      "h-12 font-black rounded-xl border-2 transition-all",
                      cashNum === amt ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "hover:border-accent hover:text-accent"
                    )}
                    onClick={() => setCashReceived(String(amt))}
                  >
                    {amt === total ? 'PAS' : (amt/1000)+'rb'}
                  </Button>
                ))}
              </div>
              <div className={cn(
                "p-6 rounded-3xl flex justify-between items-center transition-all duration-500 border-2 shadow-inner",
                change >= 0 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-destructive/5 border-destructive/20 text-destructive"
              )}>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest">{change >= 0 ? 'Uang Kembali' : 'Kurang Bayar'}</p>
                   <p className="text-3xl font-black mt-1">{formatRupiah(Math.abs(change))}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", change >= 0 ? "bg-emerald-500/10" : "bg-destructive/10")}>
                   {change >= 0 ? <CheckCircle2 /> : <AlertCircle />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-accent/5 border-2 border-accent/20 border-dashed rounded-3xl flex gap-4 items-start">
                 <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
                    <Smartphone size={20} />
                 </div>
                 <p className="text-sm text-accent leading-relaxed font-bold">
                   Pembayaran via {tx.paymentMethod}. Harap verifikasi status transaksi pada terminal EDC atau aplikasi m-banking sebelum memproses lebih lanjut.
                 </p>
              </div>
              <Button 
                variant={confirmed ? "default" : "outline"} 
                className={cn(
                  "w-full h-20 text-xl font-black gap-4 rounded-3xl border-2 transition-all",
                  confirmed ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 text-white" : "hover:border-accent hover:text-accent"
                )}
                onClick={() => setConfirmed(!confirmed)}
              >
                {confirmed ? <CheckCircle2 size={32} /> : <div className="w-8 h-8 border-4 border-muted rounded-xl" />}
                Pembayaran Terverifikasi
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-8 border-t bg-muted/5 gap-4">
           <Button variant="ghost" className="h-14 flex-1 font-bold rounded-2xl" onClick={onClose}>Batalkan</Button>
           <Button 
             className={cn(
               "h-14 flex-[2] text-lg font-black rounded-2xl shadow-2xl transition-all active:scale-95",
               !isReadyToPay ? "opacity-30" : "bg-accent hover:bg-accent/90 shadow-accent/20"
             )}
             disabled={!isReadyToPay || loading}
             onClick={handleConfirm}
           >
             {loading ? 'Menyelesaikan...' : 'Selesaikan Transaksi'}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Modal Checkout
function CheckoutModal({ cart, onClose, onSuccess, user }) {
  const [payMethod, setPayMethod] = useState('Tunai');
  const [discount, setDiscount] = useState(0);
  const [tableNum, setTableNum] = useState('');
  const [orderType, setOrderType] = useState('Dine-in');
  const [loading, setLoading] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = Math.round(subtotal * 0.1);
  const discountAmount = Math.round(subtotal * (discount / 100));
  const total = subtotal + taxAmount - discountAmount;
  const changeAmount = Number(cashReceived) - total;

  const handlePay = async () => {
    if (payMethod === 'Tunai' && Number(cashReceived) < total) {
      alert('Uang tunai kurang!');
      return;
    }

    setLoading(true);
    try {
      const res = await api.checkout({
        tableType: orderType === 'Dine-in' ? `Meja ${tableNum}` : orderType,
        paymentMethod: payMethod,
        cashierName: user.name,
        subtotal, taxAmount, discountAmount, total,
        cashReceived: Number(cashReceived),
        changeAmount: changeAmount > 0 ? changeAmount : 0,
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
      });
      onSuccess(res);
    } catch (e) {
      alert('Gagal memproses pembayaran: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'Tunai', icon: Banknote, color: 'bg-emerald-500' },
    { id: 'QRIS', icon: Wallet, color: 'bg-blue-500' },
    { id: 'Kartu Debit', icon: CreditCard, color: 'bg-purple-500' },
    { id: 'Transfer', icon: Landmark, color: 'bg-amber-500' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 border-none rounded-[3rem] overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          {/* Summary Panel */}
          <div className="w-full md:w-[360px] p-8 bg-muted/20 border-r border-muted flex flex-col h-full">
            <div className="mb-6">
               <h3 className="text-xl font-black">Detail Tagihan</h3>
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Konfirmasi Pesanan</p>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4 animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex-1">
                    <p className="text-sm font-black truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{item.qty}x {formatRupiah(item.price)}</p>
                  </div>
                  <p className="text-sm font-black">{formatRupiah(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="pt-6 mt-4 border-t-2 border-dashed border-muted-foreground/20 space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Pajak (10%)</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="text-base font-black uppercase tracking-tighter">Total</span>
                <span className="text-3xl font-black text-accent">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center"><MapPin size={12} className="text-muted-foreground" /></div>
                 <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Tipe Pelayanan</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'Dine-in', label: 'Makan Sini', icon: Coffee },
                  { id: 'Take Away', label: 'Bawa Pulang', icon: ShoppingBag }
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <button 
                      key={type.id} 
                      onClick={() => setOrderType(type.id)}
                      className={cn(
                        "h-14 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-sm",
                        orderType === type.id ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "bg-background border-muted hover:border-accent/40"
                      )}
                    >
                      <Icon size={18} /> {type.label}
                    </button>
                  );
                })}
              </div>
              {orderType === 'Dine-in' && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                   <Input 
                     placeholder="Nomor Meja" 
                     value={tableNum} onChange={e => setTableNum(e.target.value)}
                     className="h-14 text-center text-2xl font-black rounded-2xl border-2 focus:ring-accent bg-muted/20 shadow-inner"
                     autoFocus
                   />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center"><Wallet size={12} className="text-muted-foreground" /></div>
                 <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Metode Pembayaran</h4>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {methods.map(m => {
                  const Icon = m.icon;
                  const isActive = payMethod === m.id;
                  return (
                    <button 
                      key={m.id}
                      onClick={() => {
                        setPayMethod(m.id);
                        if (m.id !== 'Tunai') setCashReceived('');
                      }}
                      className={cn(
                        "h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all group",
                        isActive ? "bg-accent border-accent text-white shadow-xl shadow-accent/30 scale-105 z-10" : "bg-muted/10 border-transparent hover:bg-muted/30"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-lg transition-colors", isActive ? "bg-white/20" : "bg-background shadow-sm")}>
                        <Icon size={20} className={isActive ? "text-white" : "text-muted-foreground group-hover:text-accent"} />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">{m.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {payMethod === 'Tunai' && (
              <div className="p-5 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-3xl space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-700 px-2">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-emerald-500/40">Rp</span>
                      <Input 
                        type="number"
                        value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                        placeholder="0"
                        className="h-14 text-2xl font-black pl-11 rounded-2xl border-2 border-emerald-500/30 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[50000, 100000, 200000].map(amt => (
                        <button key={amt} onClick={() => setCashReceived(String(amt))} className="px-2 py-1 bg-white border border-emerald-500/20 rounded-lg text-[8px] font-black text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                          {amt/1000}rb
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-700 px-2 text-right block">Kembalian</label>
                    <div className="h-14 flex items-center justify-end px-5 bg-white rounded-2xl border-2 border-emerald-500/30">
                       <span className={cn("text-2xl font-black", changeAmount >= 0 ? "text-emerald-600" : "text-muted-foreground/30")}>
                         {changeAmount >= 0 ? formatRupiah(changeAmount) : 'Rp 0'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" className="flex-1 h-14 font-bold rounded-2xl" onClick={onClose}>Kembali</Button>
              <Button 
                className={cn(
                  "flex-[2] h-14 text-base font-black shadow-xl rounded-2xl group transition-all",
                  (payMethod === 'Tunai' && (Number(cashReceived) < total || !cashReceived)) ? "opacity-30" : "bg-accent hover:bg-accent/90 shadow-accent/20 active:scale-95"
                )} 
                onClick={handlePay} 
                disabled={loading || (payMethod === 'Tunai' && (Number(cashReceived) < total || !cashReceived))}
              >
                 <span className="flex items-center gap-2">
                   {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
                   {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                 </span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Page Utama
export default function KasirPage({ user, onNavigate }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedPendingTx, setSelectedPendingTx] = useState(null);

  const fetchMenuAndOrders = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [menuData, txData, shiftData] = await Promise.all([
        api.getMenu().catch(() => []), 
        api.getTransactions().catch(() => []),
        api.getActiveShift().catch(() => null)
      ]);
      setMenus(Array.isArray(menuData) ? menuData : []);
      setActiveShift(shiftData);
      setPendingOrders(Array.isArray(txData) ? txData.filter(t => 
        (t.paymentStatus === 'pending_payment' && t.paymentMethod === 'Tunai') || 
        t.paymentStatus === 'pending_acceptance'
      ) : []);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!window.confirm('Yakin ingin menutup shift sekarang?')) return;
    const actualCash = prompt('Masukkan total uang tunai di laci (Cash on Hand):');
    if (actualCash === null) return;
    
    try {
      await api.updateShift(activeShift.id, { 
        status: 'closed', 
        actual_cash: Number(actualCash),
        endTime: new Date().toISOString()
      });
      alert('Shift berhasil ditutup. Sistem akan logout otomatis.');
      window.location.reload();
    } catch (e) { alert('Gagal tutup shift'); }
  };

  useEffect(() => {
    fetchMenuAndOrders(true);
    const interval = setInterval(() => fetchMenuAndOrders(false), 8000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const safeMenus = Array.isArray(menus) ? menus : [];
  const filtered = safeMenus.filter(m => (category === 'Semua' || m.category === category) && (m.name || '').toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (!loading && !activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] max-w-md mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-accent/10 rounded-[3rem] flex items-center justify-center shadow-inner relative group">
          <div className="absolute inset-0 bg-accent/20 rounded-[3rem] animate-ping opacity-20" />
          <Lock size={56} className="text-accent group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight">Shift Terkunci</h2>
          <p className="text-muted-foreground mt-3 font-medium leading-relaxed">
            Sesi kasir belum aktif atau sudah ditutup. Harap buka shift baru dari dashboard manajemen untuk mulai melayani pelanggan.
          </p>
        </div>
        <Button size="lg" className="h-14 px-10 font-black text-lg bg-accent shadow-xl shadow-accent/20 gap-3" onClick={() => onNavigate?.('shift')}>
          <Clock size={24} /> Buka Manajemen Shift
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8 animate-in fade-in duration-700">
      
      {/* Product List Section */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6 overflow-hidden">
        
        {/* Toolbar: Search & Categories */}
        <div className="flex flex-col gap-4 shrink-0">
          {/* Search Bar Row */}
          <div className="relative group p-1">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
             </div>
             <Input 
               className="pl-12 h-12 rounded-2xl border-none bg-card shadow-lg shadow-black/5 focus:bg-background focus:ring-2 focus:ring-accent/40 text-md font-bold transition-all" 
               placeholder="Cari menu terbaik Anda..." 
               value={search} onChange={e => setSearch(e.target.value)}
             />
          </div>

          {/* Categories Row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {MENU_CATEGORIES.map(c => (
              <button 
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border",
                  category === c 
                    ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" 
                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Menu */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 content-start auto-rows-max pb-10">
          {loading ? (
            Array(10).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted/40 rounded-3xl animate-pulse" />
            ))
          ) : filtered.map(item => (
            <div 
              key={item.id} 
              className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
              onClick={() => addToCart(item)}
            >
              <div className="aspect-square w-full bg-muted relative shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-40 group-hover:scale-110 transition-transform duration-500">{item.icon || '☕'}</div>
                )}
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              
              <div className="p-4 flex flex-col justify-between bg-card shrink-0">
                <div>
                  <h3 className="font-bold text-base text-foreground leading-tight">{item.name}</h3>
                </div>
                <div className="mt-4">
                   <p className="text-lg font-black text-foreground">{formatRupiah(item.price)}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20 space-y-4">
               <SearchX size={80} className="mx-auto" strokeWidth={1} />
               <p className="text-2xl font-black uppercase tracking-[0.2em]">Menu Tidak Ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar Section */}
      <div className="w-full lg:w-[350px] flex flex-col shrink-0 gap-4">
         
         {/* Pending Orders Tab Button (if any) */}
         {pendingOrders.length > 0 && (
            <Button 
              variant="outline" 
              className="h-12 rounded-2xl border-2 border-accent text-accent font-bold gap-3 animate-pulse hover:animate-none shadow-sm"
              onClick={() => setActiveTab(activeTab === 'pending' ? 'menu' : 'pending')}
            >
               <Zap className="fill-accent" size={16} />
               ADA {pendingOrders.length} MENUNGGU
               <ChevronDown className={cn("transition-transform", activeTab === 'pending' ? "rotate-180" : "")} />
            </Button>
         )}

         <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-xl bg-card rounded-2xl">
            <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                     <ShoppingCart size={20} />
                  </div>
                  <div>
                     <CardTitle className="text-lg font-bold leading-none">Keranjang</CardTitle>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                        <User size={10} /> {user.name.split(' ')[0]}
                     </p>
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Item</span>
                  <span className="text-xl font-black text-accent">{cart.reduce((s, i) => s + i.qty, 0)}</span>
               </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0 scroll-smooth custom-scrollbar">
               {activeTab === 'pending' ? (
                  <div className="divide-y divide-border/50">
                     {pendingOrders.map(tx => (
                        <div key={tx.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors group">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-sm font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    {tx.customerName || 'Tamu'}
                                 </p>
                                 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{tx.tableType} · {tx.paymentMethod}</p>
                              </div>
                              <p className="font-bold text-accent">{formatRupiah(tx.total)}</p>
                           </div>
                           <Button className="w-full h-10 font-bold bg-accent rounded-xl text-xs gap-2" onClick={() => setSelectedPendingTx(tx)}>
                              <Banknote size={14} /> Bayar
                           </Button>
                        </div>
                     ))}
                  </div>
               ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 opacity-40">
                     <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center rotate-6">
                        <ShoppingBag size={32} strokeWidth={1.5} />
                     </div>
                     <div>
                        <p className="text-base font-bold uppercase tracking-widest">Kosong</p>
                        <p className="text-xs font-medium mt-1">Pilih menu untuk melayani.</p>
                     </div>
                  </div>
               ) : (
                  <div className="divide-y divide-border/50">
                     {cart.map(item => (
                        <div key={item.id} className="p-4 flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                           <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0">
                              {item.icon || '☕'}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                              <p className="text-xs font-bold text-accent mt-0.5">{formatRupiah(item.price)}</p>
                           </div>
                           <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border shadow-sm">
                              <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors text-muted-foreground"><Minus size={12} /></button>
                              <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                              <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors text-primary"><Plus size={12} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </CardContent>

            {cart.length > 0 && activeTab === 'menu' && (
               <CardFooter className="flex-col gap-4 p-5 bg-muted/20 border-t border-border/50">
                  <div className="w-full space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                        <span>Pajak (10%)</span>
                        <span>{formatRupiah(Math.round(subtotal * 0.1))}</span>
                     </div>
                      <div className="flex justify-between items-center bg-background rounded-2xl p-4 border border-border shadow-sm ring-1 ring-black/5">
                         <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Pembayaran</p>
                            <p className="text-xl font-black text-primary">{formatRupiah(subtotal + Math.round(subtotal * 0.1))}</p>
                         </div>
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl shrink-0" onClick={() => setCart([])}>
                            <Trash2 size={18} />
                         </Button>
                      </div>
                   </div>
                   <Button 
                     className="w-full h-13 text-sm font-black rounded-2xl shadow-lg shadow-accent/10 bg-accent hover:bg-accent/90 group relative overflow-hidden transition-all active:scale-95"
                     onClick={() => setShowCheckout(true)}
                   >
                      <span className="relative z-10 flex items-center gap-2">
                         <Zap size={18} className="fill-white" />
                         BUAT PESANAN
                      </span>
                   </Button>
               </CardFooter>
            )}
         </Card>
      </div>

      {/* Modals & Popups */}
      {showCheckout && <CheckoutModal cart={cart} onClose={() => setShowCheckout(false)} onSuccess={(tx) => { setLastTx(tx); setShowCheckout(false); setShowSuccess(true); setCart([]); fetchMenuAndOrders(); }} user={user} />}
      
      {showSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-xl animate-in fade-in duration-500">
          <Card className="w-full max-w-sm text-center p-12 space-y-8 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] bg-background border-none rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
            <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-emerald-200 animate-bounce">
               <Check size={48} strokeWidth={4} className="text-white" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-black tracking-tight">Sukses!</h2>
               <p className="text-muted-foreground font-medium">Pesanan <span className="text-primary font-black">#{lastTx?.id?.slice(-6).toUpperCase()}</span> telah berhasil didaftarkan.</p>
            </div>
            <Button className="w-full h-14 text-lg font-black bg-primary rounded-2xl shadow-xl hover:scale-105 transition-transform" onClick={() => setShowSuccess(false)}>
               Transaksi Baru
            </Button>
          </Card>
        </div>
      )}
      
      {selectedPendingTx && <ConfirmPaymentModal tx={selectedPendingTx} onClose={() => setSelectedPendingTx(null)} onSuccess={() => { setSelectedPendingTx(null); fetchMenuAndOrders(); }} />}
    </div>
  );
}
