import { useState, useRef, useEffect } from 'react';
import { useKasir } from '../hooks/useKasir';
import { formatRupiah } from '../utils/formatters';
import { MENU_CATEGORIES } from '../utils/constants';
import api from '../api';
import ItemCustomizationModal from '../components/ItemCustomizationModal';
import {
  ShoppingCart, Search, CheckCircle2,
  Wallet, CreditCard, Banknote, Landmark,
  Plus, Minus, X, Coffee,
  ShoppingBag, Lock, Zap, Clock,
  AlertCircle, Smartphone, Check, Gift, Heart, Building2
} from 'lucide-react';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/ui/Skeleton";
import DigitalReceipt from '../components/DigitalReceipt';

import ConfirmPaymentModal from '../components/kasir/ConfirmPaymentModal';
import CheckoutModal from '../components/kasir/CheckoutModal';

const getImgUrl = (url) => {
  if (!url) return '';
  return url;
};

const parseItems = (items) => {
  if (!items) return [];
  let parsed = items;
  if (typeof items === 'string') {
    try {
      parsed = JSON.parse(items);
    } catch (e) {
      console.error('Failed to parse items string:', e);
      return [];
    }
  }
  
  if (Array.isArray(parsed)) {
    return parsed;
  }
  
  if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.items)) return parsed.items;
    if (Array.isArray(parsed.cart)) return parsed.cart;
    if (Array.isArray(parsed.data)) return parsed.data;
    
    const values = Object.values(parsed);
    if (values.length > 0 && values.every(v => typeof v === 'object' && v !== null)) {
      return values;
    }
  }
  
  return [];
};

function KasirSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-lg shrink-0" />)}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-[220px] rounded-lg" />)}
        </div>
      </div>
      <div className="w-full lg:w-[400px] shrink-0">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function KasirPage({ user }) {
  const {
    menus, loading, activeShift, pendingOrders, isOnline,
    category, setCategory, search, setSearch, filteredMenus,
    cart, addToCart, changeQty, cartItemCount, subtotal,
    showCheckout, setShowCheckout, showSuccess, setShowSuccess,
    lastTx, selectedPendingTx, setSelectedPendingTx,
    isCartOpenMobile, setIsCartOpenMobile,
    handleCheckoutSuccess, onNavigate
  } = useKasir();

  const receiptRef = useRef();
  const taxAmount = Math.round(subtotal * 0.11);
  const total = subtotal + taxAmount;

  const [showHistory, setShowHistory] = useState(false);
  const [historyTxs, setHistoryTxs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);

  const openHistory = async () => {
      setShowHistory(true);
      setHistoryLoading(true);
      try {
          const txs = await api.getTransactions();
          setHistoryTxs(Array.isArray(txs) ? txs : []);
      } catch (e) {
          console.error(e);
      } finally {
          setHistoryLoading(false);
      }
  };

  const handleRequestVoid = async (txId) => {
      if (!window.confirm("Apakah Anda yakin ingin membatalkan transaksi ini? (VOID)")) return;
      try {
          await api.requestVoid(txId);
          setHistoryTxs(prev => prev.map(t => t.id === txId ? {...t, payment_status: 'pending_void_approval'} : t));
      } catch (e) {
          alert(e.message || "Gagal request void");
      }
  };


  if (loading) return <div className="p-8 max-w-7xl mx-auto w-full"><KasirSkeleton /></div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8 animate-in fade-in duration-500 relative">
      {!isOnline && <div className="absolute top-0 left-0 right-0 z-[60] bg-rose-600 text-white p-2 text-center text-[10px] font-black uppercase">Offline Mode Active</div>}

      {!activeShift && (
        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md rounded-lg m-1">
          <Card className="max-w-sm w-full text-center p-6 space-y-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card shadow-none">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <Lock size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Kasir Terkunci</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Anda harus membuka shift kasir terlebih dahulu untuk mulai melayani transaksi.</p>
            </div>
            <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 font-bold" onClick={() => onNavigate('shift')}>
              Buka Shift Sekarang
            </Button>
          </Card>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={20} />
              <Input 
                className="pl-14 h-14 rounded-lg border border-border bg-card dark:bg-zinc-900 text-foreground placeholder:text-zinc-400 focus-visible:ring-amber-500/20 shadow-sm font-bold text-base" 
                placeholder="Cari menu terbaik Anda..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <Button variant="outline" className="h-14 px-6 rounded-lg font-bold flex items-center gap-2 border-border bg-card" onClick={openHistory}>
              <Clock size={18} /> Riwayat
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {MENU_CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)} 
                className={cn(
                  "px-4 h-8 rounded-lg text-[10px] font-bold uppercase border transition-all whitespace-nowrap active:scale-95", 
                  category === c 
                    ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 border-transparent shadow-sm font-black" 
                    : "bg-card border-border text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start pb-20 custom-scrollbar">
          {filteredMenus.map(item => (
            <div key={item.id} className="group cursor-pointer bg-card dark:bg-zinc-900 rounded-lg border border-border shadow-sm hover:border-amber-500/50 hover:shadow-md active:scale-[0.98] transition-all duration-300 flex flex-col h-[220px] overflow-hidden relative" onClick={() => setCustomizingItem(item)}>
              <div className="w-full h-[140px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                <img
                  src={getImgUrl(item.image) || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop'}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1000&auto=format&fit=crop'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-card/90 dark:bg-zinc-900/90 backdrop-blur shadow-md text-amber-500 border border-card/20 transform translate-x-12 group-hover:translate-x-0 transition-all duration-300 flex items-center justify-center"><Plus size={14} className="stroke-2" /></div>
              </div>
              <div className="h-[80px] px-4 py-3 flex flex-col justify-between shrink-0">
                <h3 className="font-bold text-[13px] leading-tight text-foreground line-clamp-2">{item.name}</h3>
                <p className="text-[15px] font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) - Mobile Only */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-[100] lg:hidden">
          <Button
            onClick={() => setIsCartOpenMobile(true)}
            className="w-full h-16 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-xl shadow-amber-500/20 dark:shadow-amber-400/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center font-bold">
                {cartItemCount}
              </div>
              <span className="font-black uppercase text-sm tracking-widest">Pesanan</span>
            </div>
            <span className="text-xl font-black font-mono tabular-nums ml-auto">
              {formatRupiah(total)}
            </span>
          </Button>
        </div>
      )}

      {/* Sidebar - Desktop (lg+) OR Drawer Overlay (Mobile) */}
      <div className={cn(
        "flex flex-col gap-6 h-full transition-all duration-500 shrink-0",
        "fixed inset-0 z-[150] lg:static lg:w-[400px]",
        !isCartOpenMobile && "hidden lg:flex"
      )}>
        {/* Backdrop for Mobile */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsCartOpenMobile(false)} />

        <Card className={cn(
          "flex-1 flex flex-col overflow-hidden bg-card border-border relative",
          "mt-auto h-[90vh] rounded-t-lg lg:h-full lg:rounded-lg lg:mt-0 animate-in slide-in-from-bottom lg:animate-none"
        )}>
          <CardHeader className="p-6 border-b border-border bg-card flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black text-foreground">Daftar Pesanan</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right text-xs font-black">
                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md">{cart.length} ITEM</span>
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-500" onClick={() => setIsCartOpenMobile(false)}><X size={20} /></Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag size={32} className="text-zinc-300 dark:text-zinc-650" />
                </div>
                <p className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Keranjang Kosong</p>
                <p className="text-[10px] text-zinc-400 mt-2">Pilih menu untuk memulai pesanan</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                 {cart.map(item => (
                  <div key={item.customKey || item.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {item.image ? (
                        <img src={getImgUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{item.icon || '☕'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{item.name}</p>
                      <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(item.price)}</p>
                      {item.customizationSummary && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 italic leading-tight">{item.customizationSummary}</p>
                      )}
                      {item.customization?.note && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-500/70 mt-0.5 leading-tight font-medium">📋: "{item.customization.note}"</p>
                      )}
                    </div>
                    <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                      <button onClick={() => changeQty(item.customKey || item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-card text-foreground shadow-sm hover:text-rose-500"><Minus size={12} strokeWidth={3} /></button>
                      <span className="w-8 text-center text-xs font-black font-mono tabular-nums text-foreground">{item.qty}</span>
                      <button onClick={() => changeQty(item.customKey || item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-card text-foreground shadow-sm hover:text-emerald-500"><Plus size={12} strokeWidth={3} /></button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
          </CardContent>

          {cart.length > 0 && (
            <CardFooter className="p-6 bg-card border-t border-border flex-col gap-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-zinc-550 dark:text-zinc-400 font-mono tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-550 dark:text-zinc-400 font-mono tabular-nums">
                  <span>Pajak (11%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Total Bayar</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(total)}</span>
                </div>
              </div>
              <Button
                className="w-full h-14 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 font-black text-base shadow-lg shadow-amber-500/20"
                onClick={() => {
                  setIsCartOpenMobile(false);
                  setShowCheckout(true);
                }}
              >
                Lanjutkan Pembayaran
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {showCheckout && <CheckoutModal cart={cart} onClose={() => setShowCheckout(false)} onSuccess={handleCheckoutSuccess} user={user} />}

      {showSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm text-center p-6 space-y-4 rounded-lg border border-border bg-card dark:bg-zinc-900 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-md flex items-center justify-center mx-auto">
              <Check size={24} strokeWidth={4} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">Transaksi Sukses!</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Pesanan masuk ke antrean KDS.</p>
            </div>
            <div className="flex justify-center max-h-[220px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-md p-1 bg-zinc-50 dark:bg-zinc-950/20">
              <DigitalReceipt transaction={lastTx} />
            </div>
            <div className="hidden"><div ref={receiptRef}><ReceiptTemplate tx={lastTx} user={user} /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-10 rounded-md text-xs font-bold border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 active:scale-95" onClick={() => { const WinPrint = window.open('', '', 'width=900,height=650'); WinPrint.document.write(receiptRef.current.innerHTML); WinPrint.document.close(); WinPrint.focus(); WinPrint.print(); WinPrint.close(); }}>Cetak Struk</Button>
              <Button variant="outline" className="h-10 rounded-md text-xs font-bold border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 active:scale-95" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Terima kasih atas pesanan Anda!')}`, '_blank')}>Struk WA</Button>
            </div>
            <Button className="w-full h-11 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-md shadow-amber-500/20 text-xs font-bold rounded-md active:scale-95" onClick={() => setShowSuccess(false)}>Pesanan Baru</Button>
          </Card>
        </div>
      )}

      {selectedPendingTx && <ConfirmPaymentModal tx={selectedPendingTx} onClose={() => setSelectedPendingTx(null)} onSuccess={() => { setSelectedPendingTx(null); fetchMenuAndOrders(); }} />}

      {customizingItem && (
        <ItemCustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onConfirm={(customizedItem) => {
            addToCart(
              customizingItem,
              customizedItem.customization,
              customizedItem.finalPrice,
              customizedItem.customizationSummary
            );
            setCustomizingItem(null);
          }}
        />
      )}

      {/* MODAL RIWAYAT TRANSAKSI KASIR */}
      {showHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl flex flex-col h-[80vh] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 bg-card">
            <CardHeader className="border-b bg-background p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Riwayat Transaksi</CardTitle>
                  <CardDescription>Daftar transaksi pada shift hari ini.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}><X size={20} /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-zinc-900/50">
              {historyLoading ? (
                <div className="p-8 text-center"><Skeleton className="h-20 w-full mb-4" /><Skeleton className="h-20 w-full" /></div>
              ) : historyTxs.length === 0 ? (
                <div className="p-20 text-center text-zinc-500">Belum ada transaksi.</div>
              ) : (
                <div className="divide-y divide-border">
                  {historyTxs.map(tx => (
                    <div key={tx.id} className="py-3 px-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">#{tx.id.substring(0, 8).toUpperCase()}</span>
                          {tx.payment_status === 'paid' && <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">Lunas</span>}
                          {tx.payment_status === 'pending_void_approval' && <span className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase">Void Tertunda</span>}
                          {tx.payment_status === 'void' && <span className="text-[9px] bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-1.5 py-0.5 rounded font-black uppercase">Void Disetujui</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{tx.customer_name} • {tx.payment_method}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{tx.items ? (typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items).map(i => `${i.qty}x ${i.name}`).join(', ') : ''}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right ml-auto sm:ml-0">
                        <div>
                           <p className="text-base font-black font-mono tabular-nums text-zinc-900 dark:text-white">{formatRupiah(tx.total)}</p>
                           <p className="text-[9px] text-zinc-500 font-bold font-mono tabular-nums">{new Date(tx.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {tx.payment_status === 'paid' && (
                          <Button variant="outline" className="h-8 text-[10px] border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 font-bold ml-2 active:scale-95 transition-all" onClick={() => handleRequestVoid(tx.id)}>
                            Batalkan (VOID)
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
