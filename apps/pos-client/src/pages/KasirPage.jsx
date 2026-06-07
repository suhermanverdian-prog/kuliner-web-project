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

  const handleSimulateWebhook = async () => {
    setLoading(true);
    try {
      await api.simulateWebhook(tx.id);
      onSuccess();
    } catch (e) {
      alert('Simulasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-mono tabular-nums bg-black/50">
      <Card className="w-full max-w-lg border border-border rounded-lg overflow-hidden bg-card flex flex-col max-h-[90vh]">
        <CardHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500">
                <ShoppingCart size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black">Keranjang Pesanan</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Konfirmasi Pembayaran
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8 overflow-y-auto flex-1">
          <div>
            {parseItems(tx.items).map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 dark:text-zinc-100 font-medium">{item.qty}x <span className="text-foreground font-bold">{item.name}</span></span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
              <span className="font-black text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total Tagihan</span>
              <span className="font-black text-3xl text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(total)}</span>
            </div>
          </div>

          {isCash ? (
            <div className="space-y-6">
              <div className="p-6 space-y-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] text-center block">Masukkan Uang Diterima</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-600 dark:text-zinc-300 group-focus-within:text-amber-500 transition-colors">Rp</span>
                  <input
                    type="text"
                    className="w-full h-20 text-3xl text-right pr-6 font-mono tabular-nums font-black bg-card border border-border rounded-lg focus:outline-none focus:border-amber-500 text-foreground transition-colors"
                    value={cashNum > 0 ? cashNum.toLocaleString('id-ID') : ''}
                    onChange={e => setCashReceived(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className={cn(
                "p-6 rounded-lg flex justify-between items-center transition-all duration-500 border-2 shadow-inner",
                change >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
              )}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{change >= 0 ? 'Uang Kembali' : 'Kurang Bayar'}</p>
                  <p className="text-3xl font-black mt-1 font-mono tabular-nums">{formatRupiah(Math.abs(change))}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", change >= 0 ? "bg-emerald-100 dark:bg-emerald-800" : "bg-rose-100 dark:bg-rose-800")}>
                  {change >= 0 ? <CheckCircle2 /> : <AlertCircle />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500/20 border-dashed rounded-lg space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Smartphone size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-bold">Pembayaran via {tx.paymentMethod}.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-10 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest gap-2" onClick={handleSimulateWebhook} disabled={loading}>
                  <Zap size={14} className="fill-current" /> Simulasi Webhook
                </Button>
              </div>
              <Button
                variant={confirmed ? "default" : "outline"}
                className={cn("w-full h-20 text-xl font-black gap-4 rounded-lg border-2 transition-all", confirmed ? "bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900" : "")}
                onClick={() => setConfirmed(!confirmed)}
              >
                {confirmed ? <CheckCircle2 size={32} /> : <div className="w-8 h-8 border-4 border-zinc-300 dark:border-zinc-700 rounded-lg" />}
                Konfirmasi Manual
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-8 border-t border-border bg-background gap-4">
          <Button variant="ghost" className="h-14 flex-1 font-bold rounded-lg border border-border text-foreground bg-card" onClick={onClose}>Batalkan</Button>
          <Button className={cn("h-14 flex-[2] text-lg font-black rounded-lg", !isReadyToPay ? "" : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900")} disabled={!isReadyToPay || loading} onClick={handleConfirm}>
            {loading ? 'Menyelesaikan...' : 'Selesaikan Transaksi'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function CheckoutModal({ cart, onClose, onSuccess, user }) {
  const [payMethod, setPayMethod] = useState('Tunai');
  const [tableNum, setTableNum] = useState('');
  const [orderType, setOrderType] = useState('Dine-in');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [dynamicMethods, setDynamicMethods] = useState([]);
  const [complimentaryReason, setComplimentaryReason] = useState('');
  
  // B2B & Split Payment States
  const [b2bPartners, setB2bPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [splitB2bAmount, setSplitB2bAmount] = useState('');

  const isComplimentary = payMethod === 'Complimentary' || payMethod === 'Staff Benefit';
  const isB2bBilling = payMethod === 'B2B Billing';
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  
  // B2B coupons act as a payment split, not a revenue/sales discount
  const isB2bCoupon = appliedPromo && appliedPromo.partner_id;
  const discountAmount = (appliedPromo && !isB2bCoupon) ? appliedPromo.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = isComplimentary ? 0 : Math.round(subtotalAfterDiscount * 0.11);
  const total = isComplimentary ? 0 : subtotalAfterDiscount + taxAmount;
  
  // Remaining cash part when split is used
  const numericSplitB2b = Number(splitB2bAmount) || 0;
  const cashNeeded = Math.max(0, total - (isB2bBilling ? numericSplitB2b : 0));
  const changeAmount = Number(cashReceived) - (isB2bBilling ? cashNeeded : total);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    try {
      const res = await api.request(`${api.url}/promo-codes/validate`, 'POST', {
        code: promoCode.trim().toUpperCase(),
        subtotal
      });
      if (res && res.valid) {
        setAppliedPromo(res);
        if (res.partner_id) {
          setPayMethod('B2B Billing');
          setSelectedPartnerId(res.partner_id);
          setSplitB2bAmount(String(res.discountAmount));
        }
      } else {
        setPromoError(res?.error || 'Kode promo tidak valid');
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError(err.message || 'Gagal memvalidasi kode promo');
      setAppliedPromo(null);
    }
  };

  useEffect(() => {
    // 1. Get dynamic payment methods
    api.getPaymentMethods({ active: true })
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map(m => {
            if (typeof m === 'string') {
              let icon = Wallet;
              if (m.toLowerCase().includes('tunai') || m.toLowerCase().includes('cash')) icon = Banknote;
              else if (m.toLowerCase().includes('qris')) icon = Wallet;
              else if (m.toLowerCase().includes('debit') || m.toLowerCase().includes('kartu') || m.toLowerCase().includes('card')) icon = CreditCard;
              else if (m.toLowerCase().includes('transfer')) icon = Landmark;
              return { id: m, name: m, icon, is_active: true };
            } else {
              let icon = Wallet;
              const nameLower = (m.name || '').toLowerCase();
              const typeLower = (m.type || '').toLowerCase();
              if (typeLower === 'cash' || nameLower.includes('tunai') || nameLower.includes('cash')) icon = Banknote;
              else if (typeLower === 'qris' || nameLower.includes('qris')) icon = Wallet;
              else if (typeLower === 'card' || typeLower === 'debit' || nameLower.includes('debit') || nameLower.includes('kartu') || nameLower.includes('card')) icon = CreditCard;
              else if (typeLower === 'transfer' || nameLower.includes('transfer')) icon = Landmark;
              return { id: m.name, name: m.name, icon, is_active: m.is_active };
            }
          });
          const filtered = mapped.filter(m => m.is_active !== false);
          if (filtered.length > 0) {
            setDynamicMethods(filtered);
            setPayMethod(filtered[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load active payment methods for cashier:', err));

    // 2. Load B2B Partners
    api.request(`${api.url}/corporate`)
      .then(res => {
        if (Array.isArray(res)) {
          setB2bPartners(res);
          if (res.length > 0) setSelectedPartnerId(res[0].id);
        }
      })
      .catch(err => console.error('Failed to load corporate partners:', err));
  }, []);

  const handlePay = async () => {
    if (payMethod === 'Tunai' && Number(cashReceived) < total) return alert('Uang kurang!');
    if (isComplimentary && !complimentaryReason.trim()) return alert('Alasan Complimentary wajib diisi!');
    if (isB2bBilling && !selectedPartnerId) return alert('Mitra Korporat wajib dipilih!');
    
    // Validate split limits
    if (isB2bBilling && numericSplitB2b > total) {
      return alert('Jumlah tagihan B2B tidak boleh melebihi total transaksi!');
    }

    setLoading(true);
    try {
      // Build breakdown logic
      let breakdown = null;
      let finalCashReceived = isComplimentary ? 0 : (Number(cashReceived) || total);

      if (isB2bBilling) {
        const cashPart = Math.max(0, total - numericSplitB2b);
        breakdown = {
          cash: cashPart,
          b2b: numericSplitB2b
        };
        finalCashReceived = cashPart;
      }

      const payload = {
        items: cart,
        total,
        tax: taxAmount,
        discountAmount,
        promo_code: appliedPromo?.code || null,
        customer_phone: customerPhone.trim() || null,
        payment_method: payMethod,
        partner_id: isB2bBilling ? selectedPartnerId : null,
        payment_breakdown: breakdown,
        cash_received: finalCashReceived,
        table_type: orderType === 'Dine-in' ? `Meja ${tableNum}` : orderType,
        customer_name: customerName.trim() || (isComplimentary ? `${payMethod}: ${complimentaryReason}` : (tableNum ? `Meja ${tableNum}` : 'Tamu')),
        tenant_id: user?.tenant_id,
        cashier_name: user?.name || user?.username || 'Kasir'
      };

      if (navigator.onLine) {
        const res = await api.checkout(payload);
        onSuccess(res);
      } else {
        const { db } = await import('../db/offlineDb');
        const offlineId = await db.offline_transactions.add({
          tenant_id: user?.tenant_id || 'offline_tenant',
          customer_name: payload.customer_name,
          total: payload.total,
          payment_method: payload.payment_method,
          is_synced: 0,
          payload: JSON.stringify(payload)
        });
        
        // Mock successful transaction response
        const mockTx = {
          id: `OFFLINE-${offlineId}-${Date.now().toString().slice(-4)}`,
          ...payload,
          paymentStatus: 'paid',
          kdsStatus: 'new',
          created_at: new Date().toISOString()
        };
        onSuccess(mockTx);
      }
    } catch (e) {
      alert('Checkout Gagal');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    ...(dynamicMethods.length > 0 ? dynamicMethods : [
      { id: 'Tunai', icon: Banknote },
      { id: 'QRIS', icon: Wallet },
      { id: 'Kartu Debit', icon: CreditCard },
      { id: 'Transfer', icon: Landmark }
    ]),
    { id: 'Complimentary', icon: Gift },
    { id: 'Staff Benefit', icon: Heart }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-5xl shadow-2xl border border-border rounded-lg overflow-hidden flex flex-col md:flex-row h-auto max-h-[95vh] bg-card">
        <div className="w-full md:w-[320px] p-4 bg-muted border-r border-border flex flex-col">
          <h3 className="text-base font-black mb-3 text-foreground">Detail Tagihan</h3>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[150px] md:max-h-none">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate text-foreground">{item.name}</p>
                  <p className="text-[9px] text-zinc-550 dark:text-zinc-400 font-bold font-mono tabular-nums">{item.qty}x {formatRupiah(item.price)}</p>
                </div>
                <p className="text-xs font-black font-mono tabular-nums text-foreground">{formatRupiah(item.price * item.qty)}</p>
              </div>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t-2 border-dashed border-border space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest font-mono tabular-nums"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono tabular-nums"><span>Diskon Promo</span><span>-{formatRupiah(discountAmount)}</span></div>
            )}
            <div className="flex justify-between text-[9px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest font-mono tabular-nums"><span>Pajak (11%)</span><span>{formatRupiah(taxAmount)}</span></div>
            <div className="flex justify-between items-end pt-1"><span className="text-xs font-black uppercase text-foreground">Total</span><span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(total)}</span></div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex flex-col justify-between bg-card">
          <div className="space-y-1.5">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nama Pelanggan</h4>
            <Input
              placeholder="Nama Pelanggan (Opsional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-10 text-xs font-black rounded-lg bg-background border-border text-foreground focus-visible:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nomor Telepon (Loyalty)</h4>
              <Input
                placeholder="Contoh: 0812345678"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="h-10 text-xs font-black rounded-lg bg-background border-border text-foreground focus-visible:ring-amber-500/20"
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Kode Promo / Diskon</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="KODE PROMO"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="h-10 text-xs font-black rounded-lg bg-background border-border text-foreground focus-visible:ring-amber-500/20 uppercase"
                />
                <Button 
                  onClick={handleValidatePromo}
                  className="h-10 text-xs px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-bold active:scale-95"
                >
                  Cek
                </Button>
              </div>
              {appliedPromo && (
                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-1.5 rounded-md mt-1">
                  {appliedPromo.partner_id ? 'B2B Kupon' : 'Diskon'} {appliedPromo.code} berhasil digunakan! ({appliedPromo.partner_id ? 'Limit B2B' : '-Rp'} {Number(appliedPromo.discountAmount).toLocaleString('id-ID')})
                </div>
              )}
              {promoError && (
                <div className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-1.5 rounded-md mt-1">
                  {promoError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tipe Pelayanan</h4>
            <div className="grid grid-cols-2 gap-3">
              {['Dine-in', 'Take Away'].map(t => (
                <Button
                  key={t}
                  variant={orderType === t ? "default" : "outline"}
                  onClick={() => setOrderType(t)}
                  className={cn(
                    "h-10 flex-row gap-2 rounded-lg border-2 transition-all",
                    orderType === t
                      ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 border-amber-500 text-white dark:text-zinc-900 shadow-md shadow-amber-500/20"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  )}
                >
                  {t === 'Dine-in' ? <Coffee size={14} /> : <ShoppingBag size={14} />}
                  <span className="text-xs font-black uppercase">{t}</span>
                </Button>
              ))}
            </div>
            {orderType === 'Dine-in' && (
              <Input
                placeholder="Nomor Meja"
                value={tableNum}
                onChange={e => setTableNum(e.target.value)}
                className="h-10 text-xs font-black rounded-lg bg-background border-border text-foreground"
              />
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Metode Pembayaran</h4>
            <div className="grid grid-cols-6 gap-1.5">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={cn(
                    "h-11 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-all",
                    payMethod === m.id
                      ? "bg-amber-500 dark:bg-amber-400 border-amber-500 text-white dark:text-zinc-900 shadow-md shadow-amber-500/20"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  )}
                >
                  <m.icon size={14} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{m.id}</span>
                </button>
              ))}
            </div>
          </div>

          {isComplimentary && (
            <div className="space-y-1 p-2.5 bg-muted rounded-lg border border-border">
              <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Nama Penerima & Alasan</label>
              <input
                type="text"
                value={complimentaryReason}
                onChange={e => setComplimentaryReason(e.target.value)}
                className="w-full h-10 px-3 text-xs font-black bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground placeholder-zinc-400 dark:placeholder-zinc-500"
                placeholder={payMethod === 'Staff Benefit' ? "Contoh: Budi (Barista) - Break Sore" : "Contoh: Jatah Manajer, Owner Visit, Tamu VIP Mitra"}
                required
              />
            </div>
          )}

          {isB2bBilling && (
            <div className="space-y-3 p-3 bg-muted rounded-lg border border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Pilih Mitra B2B</label>
                  <select
                    value={selectedPartnerId}
                    onChange={e => setSelectedPartnerId(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-black bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground"
                  >
                    {b2bPartners.length === 0 ? (
                      <option value="">Tidak ada mitra aktif</option>
                    ) : (
                      b2bPartners.map(p => (
                        <option key={p.id} value={p.id}>{p.company_name} (Limit: Rp {Number(p.credit_limit - p.current_debt).toLocaleString('id-ID')})</option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Nominal Tagihan B2B</label>
                  <input
                    type="number"
                    value={splitB2bAmount}
                    onChange={e => setSplitB2bAmount(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-black font-mono tabular-nums bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground text-right"
                    placeholder={total.toString()}
                  />
                </div>
              </div>

              {numericSplitB2b < total && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-border">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Sisa Tunai (Bayar)</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="w-full h-10 px-3 text-md font-black font-mono tabular-nums bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground text-right"
                      placeholder={cashNeeded.toString()}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Kembalian Sisa Tunai</label>
                    <div className="w-full h-10 px-3 flex items-center justify-end bg-background border border-border rounded-md font-black text-md font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {changeAmount >= 0 ? formatRupiah(changeAmount) : 'Rp 0'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {payMethod === 'Tunai' && (
            <div className="grid grid-cols-2 gap-3 p-2.5 bg-muted rounded-lg border border-border">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Uang Tunai</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="w-full h-10 px-3 text-lg font-black font-mono tabular-nums bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 text-right"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400">Kembalian</label>
                <div className="w-full h-10 px-3 flex items-center justify-end bg-background border border-border rounded-md font-black text-lg font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {changeAmount >= 0 ? formatRupiah(changeAmount) : 'Rp 0'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-10 font-bold rounded-lg border-border text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Kembali
            </Button>
            <Button
              className={cn(
                "flex-[2] h-10 rounded-lg transition-all font-black text-sm",
                ((payMethod === 'Tunai' && (Number(cashReceived) < total || !cashReceived)) ||
                 (payMethod === 'B2B Billing' && (!selectedPartnerId || (numericSplitB2b < total && (Number(cashReceived) < cashNeeded || !cashReceived)))))
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 shadow-lg shadow-amber-500/20"
              )}
              onClick={handlePay}
              disabled={loading || 
                (payMethod === 'Tunai' && (Number(cashReceived) < total || !cashReceived)) ||
                (payMethod === 'B2B Billing' && (!selectedPartnerId || (numericSplitB2b < total && (Number(cashReceived) < cashNeeded || !cashReceived))))
              }
            >
              {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

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
                    <div key={tx.id} className="p-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-black text-amber-600 dark:text-amber-400">#{tx.id.substring(0, 8).toUpperCase()}</span>
                          {tx.payment_status === 'paid' && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">Lunas</span>}
                          {tx.payment_status === 'pending_void_approval' && <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Void Tertunda</span>}
                          {tx.payment_status === 'void' && <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold uppercase">Void Disetujui</span>}
                        </div>
                        <p className="text-xs text-zinc-500 font-bold uppercase">{tx.customer_name} • {tx.payment_method}</p>
                        <p className="text-sm mt-2">{tx.items ? (typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items).map(i => `${i.qty}x ${i.name}`).join(', ') : ''}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                           <p className="text-xl font-black font-mono tabular-nums">{formatRupiah(tx.total)}</p>
                           <p className="text-[10px] text-zinc-500 font-bold">{new Date(tx.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {tx.payment_status === 'paid' && (
                          <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold ml-2" onClick={() => handleRequestVoid(tx.id)}>
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
