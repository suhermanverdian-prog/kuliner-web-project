import { useState, useEffect } from 'react';
import { formatRupiah } from '../../utils/formatters';
import api from '../../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";
import {
  Wallet, CreditCard, Banknote, Landmark,
  Gift, Heart, Coffee, ShoppingBag, X, Zap, CheckCircle2, AlertCircle, Smartphone
} from 'lucide-react';

export default function CheckoutModal({ cart, onClose, onSuccess, user }) {
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
  
  // CRM & Quick Register States
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerLookupStatus, setCustomerLookupStatus] = useState(''); // 'found', 'not_found', ''
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '' });
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    api.getCustomers()
      .then(data => setAllCustomers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Gagal memuat daftar pelanggan:', err));
  }, []);

  const handlePhoneChange = (val) => {
    const cleanVal = val.replace(/\D/g, '');
    setCustomerPhone(cleanVal);
    
    if (cleanVal.length >= 8) {
      const found = allCustomers.find(c => c.phone === cleanVal);
      if (found) {
        setCustomerName(found.name);
        setCustomerLookupStatus('found');
      } else {
        setCustomerLookupStatus('not_found');
      }
    } else {
      setCustomerLookupStatus('');
    }
  };

  const handleQuickRegister = async () => {
    if (!registerForm.name.trim()) {
      setRegisterError('Nama pelanggan wajib diisi');
      return;
    }
    setRegisterError('');
    try {
      const newCust = await api.addCustomers({
        name: registerForm.name.trim(),
        phone: customerPhone,
        email: registerForm.email.trim() || null
      });
      setAllCustomers(prev => [newCust, ...prev]);
      setCustomerName(newCust.name);
      setCustomerLookupStatus('found');
      setShowQuickRegister(false);
      setRegisterForm({ name: '', email: '' });
    } catch (err) {
      setRegisterError(err.message || 'Gagal mendaftarkan pelanggan');
    }
  };
  
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
        const { db } = await import('../../db/offlineDb');
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
              disabled={customerLookupStatus === 'found'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nomor Telepon (Loyalty)</h4>
              <Input
                placeholder="Contoh: 0812345678"
                value={customerPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                className="h-10 text-xs font-black rounded-lg bg-background border-border text-foreground focus-visible:ring-amber-500/20"
              />
              {customerLookupStatus === 'found' && (
                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  ✓ Member Terdaftar: {customerName}
                </div>
              )}
              {customerLookupStatus === 'not_found' && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="text-[9px] font-bold text-rose-500">
                    ✗ Nomor belum terdaftar sebagai member.
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowQuickRegister(true)}
                    className="h-7 text-[9px] px-2 self-start rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold active:scale-95"
                  >
                    + Daftarkan Member Baru
                  </Button>
                </div>
              )}
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
              {loading ? 'Menyelesaikan...' : 'Selesaikan Transaksi'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Register CRM Modal */}
      {showQuickRegister && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm text-left p-6 space-y-4 rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-black uppercase text-foreground">Registrasi Member Baru</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowQuickRegister(false)}><X size={14} /></Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-550">Nama Lengkap</label>
                <Input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} className="h-9 text-xs" placeholder="Nama Member" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-550">Email (Opsional)</label>
                <Input value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} className="h-9 text-xs" placeholder="member@email.com" />
              </div>
              {registerError && <p className="text-[9px] font-bold text-rose-500">{registerError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowQuickRegister(false)}>Batal</Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={handleQuickRegister}>Simpan Member</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
