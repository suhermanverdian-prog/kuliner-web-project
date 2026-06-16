import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatRupiah } from '../utils/formatters';
import { MENU_CATEGORIES } from '../utils/constants';
import { api } from '../api';
import { useGuestMenu } from '../hooks/useGuestMenu';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

// ── Lazy-loaded modals — hanya dimuat saat pertama kali dibuka ──────────────
const ItemCustomizationModal = lazy(() => import('../components/ItemCustomizationModal'));
const GuestCustomizerModal   = lazy(() => import('../components/guest/GuestCustomizerModal'));

// Fallback spinner ringan untuk modal
const ModalLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      <span className="text-xs text-zinc-400 font-mono">Memuat…</span>
    </div>
  </div>
);
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Minus, 
  Plus, 
  Clock, 
  Printer, 
  MessageSquare, 
  User, 
  Award, 
  Wallet, 
  QrCode, 
  Banknote, 
  MapPin,
  Star,
  Coffee,
  CreditCard,
  Landmark,
  ArrowLeft,
  X,
  Smartphone,
  CheckCircle2,
  Download,
  Send
} from 'lucide-react';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
// html2canvas & jsPDF dimuat secara dinamis hanya saat tombol Download PDF diklik
// → menghemat ~200 kB dari initial bundle GuestMenuPage
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

// KEN ENTERPRISE RECEIPT ENGINE
const printReceipt = (order) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>Print Receipt</title></head><body><div id="print-area"></div></body></html>');
  
  // Kita akan merender komponen ReceiptTemplate ke dalam window baru
  // Namun karena keterbatasan lingkungan web, cara termudah adalah 
  // menggunakan template HTML yang sudah kita standarisasi.
  const msg = `Halo ${order.customerName}! Terima kasih sudah memesan di BrewMaster.`;

};

function ProductImage({ src, alt, icon, className }) {
  const [error, setError] = useState(false);
  const imageUrl = src;

  if (imageUrl && !error) {
    return <img src={imageUrl} alt={alt} onError={() => setError(true)} className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${className}`} />;
  }
  return <span className="text-4xl filter drop-shadow-md font-mono tabular-nums">{icon || '☕'}</span>;
}

function OrderTracking({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  const handleDownloadPDF = async () => {
    try {
      const element = receiptRef.current;
      // Dynamic import — library baru diunduh saat tombol ini diklik
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [80, 200]);
      pdf.addImage(imgData, 'PNG', 0, 0, 80, 0);
      pdf.save(`struk-${orderId}.pdf`);
    } catch (e) { console.error('PDF Error:', e); }
  };

  const fetchOrder = async () => {
    try {
      const txs = await api.getTransactions();
      const found = txs.find(t => t.id === orderId);
      if (found) {
        setOrder(found);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useRealtimeSync({
    'KDS_UPDATE': ({ id, status }) => {
       if (id === orderId) {
          console.log(`🔔 [GuestMenu] Pesanan ${id} update status ke ${status}`);
          setOrder(prev => prev ? { ...prev, kdsStatus: status } : prev);
       }
    }
  });

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-lg animate-spin mb-4" />
      <p className="text-zinc-500 dark:text-zinc-100 animate-pulse font-medium">Menghubungkan ke dapur...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-bold mb-2">Pesanan Tidak Ditemukan</h2>
      <p className="text-zinc-500 dark:text-zinc-100 mb-6">ID: {orderId}</p>
      <Button onClick={onBack} variant="outline" className="rounded-lg px-8">Kembali ke Menu</Button>
    </div>
  );

  const steps = [
    { key: 'new', label: 'Pesanan Diterima', icon: <ShoppingBag size={20} />, desc: 'Dapur telah menerima pesananmu' },
    { key: 'cooking', label: 'Sedang Dimasak', icon: <Coffee size={20} />, desc: 'Koki sedang menyiapkan hidanganmu' },
    { key: 'ready', label: 'Siap Disajikan', icon: <CheckCircle2 size={20} />, desc: 'Silakan ambil di meja kasir' },
    { key: 'served', label: 'Selesai', icon: <Star size={20} />, desc: 'Terima kasih! Selamat menikmati' },
  ];

  const currentIdx = steps.findIndex(s => s.key === (order.kdsStatus || 'new'));

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="max-w-md mx-auto">
        {/* Header Tracking */}
        <div className="bg-primary text-primary-foreground p-8 rounded-b-[3rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 ">
            <MapPin size={120} className="rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 ">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Live Order Tracking</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Status Pesanan</h1>
            <p className=" text-sm font-medium">#{order?.id?.slice(-6).toUpperCase()} · {order?.customerName || 'Pelanggan'}</p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="px-6 -mt-8">
          <Card className="border-none shadow-2xl rounded-lg">
            <CardContent className="p-8">
              <div className="space-y-10 relative">
                {/* Connector Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-background" />
                <div 
                  className="absolute left-[19px] top-2 w-0.5 bg-primary transition-all duration-1000 ease-in-out" 
                  style={{ height: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  
                  return (
                    <div key={step.key} className={`flex gap-6 relative z-10 transition-all duration-500 ${isDone ? '' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${ isCurrent ? 'bg-primary text-primary-foreground scale-125 shadow-lg shadow-primary/30 ring-4 ring-primary/20' : isDone ? 'bg-primary/20 text-primary' : 'bg-background text-zinc-500 dark:text-zinc-100' }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-black ${isCurrent ? 'text-primary text-lg' : 'text-foreground'}`}>{step.label}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-100 font-medium mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Instruction Section */}
        {order.paymentStatus === 'pending_payment' && (
          <div className="px-6 mt-6">
            <Card className={`border-2 rounded-lg ${order.paymentMethod === 'Tunai' ? 'border-amber-500 bg-amber-50/50' : 'border-primary bg-primary/5'}`}>
              <CardContent className="p-6 text-center">
                {order.paymentMethod === 'Tunai' ? (
                  <>
                    <Banknote size={48} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-xl font-black text-amber-600 mb-2">Selesaikan di Kasir</h3>
                    <p className="text-sm font-medium text-amber-700/80">
                      Silakan menuju meja kasir untuk melakukan pembayaran. Dapur akan mulai menyiapkan pesanan Anda setelah pembayaran berhasil.
                    </p>
                  </>
                ) : (
                  <>
                    {order.paymentMethod === 'QRIS' && <QrCode size={48} className="mx-auto text-primary mb-4" />}
                    {order.paymentMethod === 'Transfer Bank Manual' && <Landmark size={48} className="mx-auto text-primary mb-4" />}
                    {(order.paymentMethod === 'E-Wallet' || !['QRIS', 'Transfer Bank Manual', 'Tunai'].includes(order.paymentMethod)) && <Wallet size={48} className="mx-auto text-primary mb-4" />}
                    
                    <h3 className="text-xl font-black text-primary mb-2">Selesaikan Pembayaran</h3>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-100 mb-6">
                      {order.paymentMethod === 'QRIS' && 'Scan QR Code menggunakan aplikasi m-banking atau e-wallet Anda.'}
                      {order.paymentMethod === 'Transfer Bank Manual' && `Harap transfer tepat senilai Rp ${order.total.toLocaleString('id-ID')} ke Rekening BCA 123456789 a/n KEN.`}
                      {order.paymentMethod === 'E-Wallet' && 'Buka aplikasi GoPay/OVO/Dana Anda dan konfirmasi pembayaran.'}
                      {!['QRIS', 'Transfer Bank Manual', 'E-Wallet', 'Tunai'].includes(order.paymentMethod) && `Selesaikan pembayaran melalui aplikasi ${order.paymentMethod} Anda.`}
                    </p>
                    
                    <Button 
                      onClick={async (e) => {
                        const btn = e.currentTarget;
                        const originalText = btn.innerHTML;
                        btn.innerHTML = 'Memproses...';
                        btn.disabled = true;
                        try {
                          await fetch('/api/webhooks/simulate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ transactionId: order.id })
                          });
                          btn.innerHTML = '✅ Lunas!';
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (err) {
                          alert('Simulasi gagal: ' + err.message);
                          btn.innerHTML = originalText;
                          btn.disabled = false;
                        }
                      }}
                      className="w-full rounded-lg h-12 font-black shadow-lg hover:scale-105 transition-all"
                    >
                      <CreditCard className="mr-2" size={18} /> Simulasikan Bayar ({order.paymentMethod})
                    </Button>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 uppercase tracking-wider font-semibold">
                      *Tombol ini khusus untuk demonstrasi webhook otomatis.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Summary Card */}
        <div className="px-6 mt-6">
          <Card className="rounded-lg border-muted/50">
            <CardContent className="p-6">
              <h5 className="font-bold mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                Rincian Pesanan
              </h5>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-zinc-500 dark:text-zinc-100">
                      <span className="font-bold text-foreground">{item.qty}x</span> {item.name}
                    </span>
                    <span className="font-bold font-mono tabular-nums">{formatRupiah(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-dashed space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold">Subtotal + Pajak</span>
                    <span className="font-bold font-mono tabular-nums">{formatRupiah(order.total - (order.unique_code || 0))}</span>
                  </div>
                  {order.unique_code > 0 && (
                    <div className="flex justify-between items-center text-sm text-amber-600 font-black">
                      <span>Kode Unik</span>
                      <span>+{order.unique_code}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-black text-lg">Total Bayar</span>
                    <span className="text-2xl font-black text-primary font-mono tabular-nums">{formatRupiah(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button onClick={handleDownloadPDF} variant="outline" className="rounded-lg gap-2 h-12 font-bold">
                  <Download size={18} /> Simpan PDF
                </Button>
                <Button 
                  onClick={() => {
                    const text = encodeURIComponent(`Halo, ini struk digital saya untuk pesanan #${order?.id?.slice(-6).toUpperCase()}. Terima kasih!`);
                    window.open(`https://wa.me/${order.customerPhone}?text=${text}`, '_blank');
                  }} 
                  className="bg-[#25D366] hover:bg-[#128C7E] text-zinc-900 dark:text-zinc-100 rounded-lg gap-2 h-12 font-bold"
                >
                  <Send size={18} /> WhatsApp
                </Button>
              </div>

              {/* Hidden Receipt for processing */}
              <div className="hidden">
                 <div ref={receiptRef}>
                    <ReceiptTemplate tx={order} user={{ name: 'Self-Service' }} />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={onBack} variant="ghost" className="w-full mt-6 text-zinc-500 dark:text-zinc-100 hover:text-primary font-bold rounded-lg h-12">
            <ArrowLeft size={18} className="mr-2" /> Kembali ke Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { key: 'Tunai',         label: 'Tunai',        icon: <Banknote size={20} />, desc: 'Bayar ke kasir' },
  { key: 'QRIS',          label: 'QRIS',         icon: <QrCode size={20} />, desc: 'Scan QR Code' },
  { key: 'Transfer',      label: 'Transfer Bank', icon: <Landmark size={20} />, desc: 'Transfer ke Rekening' },
  { key: 'E-Wallet',      label: 'E-Wallet',     icon: <Wallet size={20} />, desc: 'GoPay / OVO / Dana' },
];

function CheckoutForm({ total, cart, onBack, onSuccess, user, defaultOrderType, defaultTableNum }) {
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    tableNum: defaultTableNum || '', 
    note: '', 
    orderType: defaultOrderType || 'Dine-in',
    paymentMethod: 'Tunai'
  });
  const [dynamicMethods, setDynamicMethods] = useState([]);

  useEffect(() => {
    api.getPaymentMethods({ active: true })
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map(m => {
            if (typeof m === 'string') {
              let icon = <Wallet size={20} />;
              let desc = 'Bayar Elektronik';
              if (m.toLowerCase().includes('tunai') || m.toLowerCase().includes('cash')) {
                icon = <Banknote size={20} />;
                desc = 'Bayar ke kasir';
              } else if (m.toLowerCase().includes('qris')) {
                icon = <QrCode size={20} />;
                desc = 'Scan QR Code';
              } else if (m.toLowerCase().includes('debit') || m.toLowerCase().includes('kartu') || m.toLowerCase().includes('card')) {
                icon = <CreditCard size={20} />;
                desc = 'Bayar dengan kartu';
              } else if (m.toLowerCase().includes('transfer')) {
                icon = <Landmark size={20} />;
                desc = 'Transfer ke Rekening';
              }
              return { key: m, label: m, icon, desc, is_active: true };
            } else {
              let icon = <Wallet size={20} />;
              let desc = m.instructions || 'Selesaikan pembayaran';
              const nameLower = (m.name || '').toLowerCase();
              const typeLower = (m.type || '').toLowerCase();
              if (typeLower === 'cash' || nameLower.includes('tunai') || nameLower.includes('cash')) {
                icon = <Banknote size={20} />;
                desc = m.instructions || 'Bayar ke kasir';
              } else if (typeLower === 'qris' || nameLower.includes('qris')) {
                icon = <QrCode size={20} />;
                desc = m.instructions || 'Scan QR Code';
              } else if (typeLower === 'card' || typeLower === 'debit' || nameLower.includes('debit') || nameLower.includes('kartu') || nameLower.includes('card')) {
                icon = <CreditCard size={20} />;
                desc = m.instructions || 'Bayar dengan kartu';
              } else if (typeLower === 'transfer' || nameLower.includes('transfer')) {
                icon = <Landmark size={20} />;
                desc = m.instructions || 'Transfer ke Rekening';
              }
              return { key: m.name, label: m.name, icon, desc, is_active: m.is_active };
            }
          });
          const filtered = mapped.filter(m => 
            m.is_active !== false && 
            m.key !== 'B2B Billing' && 
            m.key !== 'Complimentary' && 
            m.key !== 'Staff Benefit'
          );
          if (filtered.length > 0) {
            setDynamicMethods(filtered);
            setForm(f => ({ ...f, paymentMethod: filtered[0].key }));
          }
        }
      })
      .catch(err => console.error('Failed to load active payment methods for guest:', err));
  }, []);

  const availableMethods = dynamicMethods.length > 0 ? dynamicMethods : [
    { key: 'Tunai',         label: 'Tunai',        icon: <Banknote size={20} />, desc: 'Bayar ke kasir' },
    { key: 'QRIS',          label: 'QRIS',         icon: <QrCode size={20} />, desc: 'Scan QR Code' },
    { key: 'Transfer',      label: 'Transfer Bank', icon: <Landmark size={20} />, desc: 'Transfer ke Rekening' },
    { key: 'E-Wallet',      label: 'E-Wallet',     icon: <Wallet size={20} />, desc: 'GoPay / OVO / Dana' },
  ];
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError('');
    try {
      const res = await api.request(`${api.url}/promo-codes/validate`, 'POST', {
        code: promoCode.trim().toUpperCase(),
        subtotal: total
      });
      if (res && res.valid) {
        setAppliedPromo(res);
      } else {
        setPromoError(res?.error || 'Kode promo tidak valid');
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError(err.message || 'Gagal memvalidasi kode promo');
      setAppliedPromo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert('Nama dan nomor WhatsApp wajib diisi!');
    setLoading(true);
    try {
      const trxData = {
        items: cart,
        total: finalTotal,
        discountAmount,
        promo_code: appliedPromo?.code || null,
        customer_phone: form.phone,
        paymentMethod: form.paymentMethod,
        tableType: form.orderType === 'Dine-in' ? (form.tableNum ? `Meja ${form.tableNum}` : 'Meja Umum') : 'Take Away',
        customerName: form.name,
        customerPhone: form.phone,
        note: form.note,
        type: 'Self Order',
        cashierName: 'Self Service (Paid)'
      };
      const res = await api.checkout(trxData);
      onSuccess(res.id);
    } catch (err) {
      console.error('Checkout Error:', err);
      alert(`⚠️ GAGAL MENGIRIM PESANAN: ${err.message}\n\nHarap hubungi kasir jika masalah berlanjut.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="p-6 flex items-center gap-4 border-b bg-card sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg">
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-black">Konfirmasi Pesanan</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section: Customer Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-lg" />
              <h2 className="text-lg font-black">Informasi Kontak</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-100 uppercase ml-1">Nama Lengkap</label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Contoh: Budi Santoso"
                  className="rounded-lg h-12 bg-background border-none"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-100 uppercase ml-1">No. WhatsApp</label>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="Contoh: 08123456789"
                  className="rounded-lg h-12 bg-background border-none"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button"
                    variant={form.orderType === 'Dine-in' ? "default" : "outline"}
                    onClick={() => setForm({...form, orderType: 'Dine-in'})}
                    className={cn(
                      "h-28 flex-col gap-2 rounded-lg border-2 transition-all",
                      form.orderType === 'Dine-in' ? "bg-primary border-primary text-zinc-900 dark:text-zinc-100 shadow-xl" : "hover:border-primary/50"
                    )}
                  >
                    <Coffee size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Makan Sini</span>
                  </Button>

                  <Button 
                    type="button"
                    variant={form.orderType === 'Take Away' ? "default" : "outline"}
                    onClick={() => setForm({...form, orderType: 'Take Away', tableNum: ''})}
                    className={cn(
                      "h-28 flex-col gap-2 rounded-lg border-2 transition-all",
                      form.orderType === 'Take Away' ? "bg-amber-500 dark:bg-amber-400 border-amber-500 dark:border-amber-400 text-zinc-900 dark:text-zinc-100 shadow-xl" : "hover:border-accent/50"
                    )}
                  >
                    <ShoppingBag size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Bawa Pulang</span>
                  </Button>
                </div>
              </div>
              {form.orderType === 'Dine-in' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-100 uppercase ml-1">No. Meja</label>
                  <Input 
                    value={form.tableNum}
                    onChange={e => setForm({...form, tableNum: e.target.value})}
                    placeholder="Meja"
                    className="rounded-lg h-12 bg-background border-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section: Promo Code */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-lg" />
              <h2 className="text-lg font-black">Miliki Kode Promo?</h2>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="MASUKKAN KODE PROMO"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="h-12 font-black rounded-lg bg-background border-none uppercase focus-visible:ring-amber-500/20"
                />
                <Button 
                  type="button"
                  onClick={handleValidatePromo}
                  className="h-12 px-6 rounded-lg bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 font-bold active:scale-95"
                >
                  Cek
                </Button>
              </div>
              {appliedPromo && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg">
                  Diskon {appliedPromo.code} berhasil digunakan! (-Rp {Number(appliedPromo.discountAmount).toLocaleString('id-ID')})
                </div>
              )}
              {promoError && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3 rounded-lg">
                  {promoError}
                </div>
              )}
            </div>
          </section>

          {/* Section: Payment Method */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-lg" />
              <h2 className="text-lg font-black">Metode Pembayaran</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {availableMethods.map(pm => (
                <button
                  type="button"
                  key={pm.key}
                  onClick={() => setForm({...form, paymentMethod: pm.key})}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 ${ form.paymentMethod === pm.key ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-muted bg-card hover:border-muted-foreground/30' }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${ form.paymentMethod === pm.key ? 'bg-primary text-primary-foreground' : 'bg-background text-zinc-500 dark:text-zinc-100' }`}>
                    {pm.icon}
                  </div>
                  <div className="font-black text-sm">{pm.label}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{pm.desc}</div>
                </button>
              ))}
            </div>
          </section>
        </form>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t z-30">
          <div className="max-w-md mx-auto">
            {discountAmount > 0 && (
              <div className="flex justify-between items-center mb-2 px-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Diskon Promo ({appliedPromo?.code})</span>
                <span className="font-mono tabular-nums">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Bayar</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{formatRupiah(finalTotal)}</p>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-[1.5] h-14 rounded-lg font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 active:scale-95 shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-lg animate-spin" />
                ) : (
                  <>Konfirmasi & Pesan <ChevronRight size={20} className="ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClose, onChangeQty, onCheckout }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-[1000] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity" onClick={onClose} />
      <div className="ml-auto w-full max-w-sm bg-background h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-xl font-black">Keranjang</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg">
            <X size={24} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center  p-10">
              <div className="w-20 h-20 bg-background rounded-lg flex items-center justify-center mb-4">
                <ShoppingBag size={40} className="text-zinc-500 dark:text-zinc-100" />
              </div>
              <h4 className="text-lg font-bold">Keranjang Kosong</h4>
              <p className="text-sm">Pilih menu favoritmu untuk mulai memesan!</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.customKey || item.id} className="flex gap-4 group">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
                  <ProductImage src={item.image} alt={item.name} icon={item.icon} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="font-bold text-sm truncate">{item.name}</h4>
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-sm mt-0.5 font-mono tabular-nums">{formatRupiah(item.price)}</p>
                  {item.customizationSummary && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 italic leading-tight">{item.customizationSummary}</p>
                  )}
                  {item.customization?.note && (
                    <p className="text-xs text-amber-600 dark:text-amber-500/70 mt-0.5 leading-tight font-medium">📋: "{item.customization.note}"</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-4">
                    <button 
                      onClick={() => onChangeQty(item.customKey || item.id, -1)}
                      className="w-8 h-8 rounded-lg border border-muted-foreground/30 flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{item.qty}</span>
                    <button 
                      onClick={() => onChangeQty(item.customKey || item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 flex items-center justify-center transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 pb-20 sm:pb-6 border-t space-y-4 bg-background">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-100">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-100">
                <span>Pajak (11%)</span>
                <span>{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-dashed">
                <span>Total</span>
                <span className="text-primary font-mono tabular-nums">{formatRupiah(total)}</span>
              </div>
            </div>
            <Button 
              onClick={() => onCheckout(total)}
              className="w-full h-14 rounded-lg font-black text-lg shadow-lg shadow-primary/20"
            >
              Checkout Sekarang
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestMenuPage({ user }) {
  const { tenantId, tableNumber: tableFromQR } = useParams();
  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginMode, setLoginMode] = useState('login'); // 'login' | 'register'
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const customersList = await api.getCustomers();
      const found = (customersList || []).find(c => c.phone === loginPhone);
      if (found) {
        setUser({
          id: found.id,
          name: found.name,
          phone: found.phone,
          loyalty_points: found.loyalty_points || 0,
          role: 'customer'
        });
        setShowLogin(false);
        navigate('/customer');
      } else {
        alert('Nomor HP belum terdaftar sebagai member. Silakan gunakan tab "Daftar" untuk menjadi member baru.');
      }
    } catch (err) {
      alert('Gagal login: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMemberRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regPhone) return alert('Nama dan Nomor HP wajib diisi!');
    setLoginLoading(true);
    try {
      const customersList = await api.getCustomers();
      const exists = (customersList || []).some(c => c.phone === regPhone);
      if (exists) {
        alert('Nomor HP sudah terdaftar. Silakan masuk lewat tab Login.');
        setLoginMode('login');
        setLoginPhone(regPhone);
        setLoginLoading(false);
        return;
      }

      const newMember = await api.addCustomers({
        name: regName,
        phone: regPhone,
        email: regEmail || '',
        points: 0
      });

      if (newMember) {
        setUser({
          id: newMember.id,
          name: newMember.name,
          phone: newMember.phone,
          loyalty_points: newMember.loyalty_points || 0,
          role: 'customer'
        });
        setShowLogin(false);
        navigate('/customer');
        alert('Pendaftaran berhasil! Selamat bergabung sebagai member baru.');
      }
    } catch (err) {
      alert('Gagal mendaftar: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Initialize storage if accessing via a direct store link
  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    }
  }, [tenantId]);

  const {
    category, setCategory,
    search, setSearch,
    cart, setCart,
    showCart, setShowCart,
    checkoutTotal, setCheckoutTotal,
    activeOrderId, setActiveOrderId,
    menu,
    orderMode, setOrderMode,
    tableNumber, setTableNumber,
    activeShift,
    loadingShift,
    handleOrderSuccess,
    filtered,
    totalItems,
    addToCart,
    changeQty,
    getQty
  } = useGuestMenu({ user, tableFromQR });

  const [customizingItem, setCustomizingItem] = useState(null);

  if (activeOrderId) {
    return <OrderTracking orderId={activeOrderId} onBack={() => { setActiveOrderId(null); localStorage.removeItem('lastOrderId'); }} />;
  }

  if (checkoutTotal !== null) {
    return (
      <CheckoutForm
        total={checkoutTotal}
        cart={cart}
        onBack={() => setCheckoutTotal(null)}
        onSuccess={handleOrderSuccess}
        user={user}
        defaultOrderType={orderMode || 'Take Away'}
        defaultTableNum={tableNumber}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 relative">
      {!activeShift && !loadingShift && !user && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-xl p-6 text-center">
          <div className="space-y-6 max-w-sm animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                <Coffee size={48} className="animate-bounce" />
             </div>
             <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">Outlet Sedang Tutup</h1>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-100 leading-relaxed">
                  Mohon maaf, saat ini kami belum menerima pesanan online. <br/>
                  Silakan datang kembali beberapa saat lagi!
                </p>
             </div>
             <div className="pt-4">
                <div className="h-1 w-20 bg-amber-500 dark:bg-amber-400 mx-auto rounded-lg" />
             </div>
          </div>
        </div>
      )}
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-[100] w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md">BM</div>
            <span className="font-black text-xl tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">BrewMaster</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-900 font-bold flex items-center justify-center shadow-inner">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 leading-none">{user.points || 0} PTS</span>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLogin(true)} 
                className="rounded-lg font-bold text-xs"
              >
                👤 Member
              </Button>
            )}
            
            <Button 
              id="btn-buka-keranjang"
              onClick={() => setShowCart(true)}
              variant={totalItems > 0 ? "default" : "secondary"}
              size="sm"
              className="rounded-lg px-4 h-8 font-black transition-all duration-300"
            >
              <ShoppingBag size={16} className="mr-2" />
              {totalItems > 0 ? totalItems : '0'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner - Elegant Customer Theme */}
      <div className="relative overflow-hidden py-10 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-zinc-900/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg blur-[100px] -mr-32 -mt-32" />
        
        <div className="max-w-3xl mx-auto px-6 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs mb-1">BrewMaster Culinary</p>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter leading-none">
              Crafted Coffee & <span className="text-amber-500 italic">Premium Desserts</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-[400px] leading-relaxed">
              Pilih menu favorit Anda, lakukan pemesanan secara praktis dari meja, dan nikmati karya racikan terbaik dari barista kami.
            </p>
          </div>
          <div className="hidden md:block pb-1">
             <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-lg bg-emerald-500 animate-pulse"/> Dapur Siap Melayani</span>
             </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-6 relative z-20">
        {/* Search & Categories */}
        <div className="bg-card rounded-lg p-6 shadow-2xl border border-muted/50 space-y-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-100" size={18} />
            <Input 
              placeholder="Lagi pengen minum apa?" 
              className="pl-12 h-14 rounded-lg bg-background border-none font-medium text-base focus-visible:ring-primary"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {[...new Set(['Semua', ...MENU_CATEGORIES])].map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)}
                className={cn(
                  "px-6 h-10 rounded-lg whitespace-nowrap font-bold text-xs uppercase tracking-wider transition-all",
                  category === c 
                  ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/10 scale-105' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500 dark:text-zinc-100">
              <div className="text-4xl mb-4">☕</div>
              <p className="font-bold">Menu tidak ditemukan</p>
              <p className="text-sm">Coba cari dengan kata kunci lain.</p>
            </div>
          ) : (
            filtered.map(item => {
              const qty = getQty(item.id);
              return (
                <div 
                  key={item.id} 
                  onClick={() => setCustomizingItem(item)}
                  className={`group bg-card rounded-lg border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer active:scale-[0.99] select-none ${ qty > 0 ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-500/5' : 'border-muted/50' }`}
                >
                  <div className="flex p-4 gap-4 h-[140px]">
                    <div className="w-1/3 aspect-square rounded-lg overflow-hidden bg-background relative">
                      <ProductImage src={item.image} alt={item.name} icon={item.icon} />
                      {qty > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                          {qty}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h3 className="font-black text-base truncate group-hover:text-amber-500 transition-colors">{item.name}</h3>
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-1">{item.category}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-lg text-zinc-900 dark:text-white font-mono tabular-nums">{formatRupiah(item.price)}</span>
                        
                        {qty === 0 ? (
                          <button 
                            id={`btn-tambah-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomizingItem(item);
                            }}
                            className="w-10 h-10 rounded-lg bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 flex items-center justify-center shadow-md active:scale-90 transition-all"
                          >
                            <Plus size={20} />
                          </button>
                        ) : (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-4 bg-background/50 backdrop-blur-md rounded-lg p-1 border"
                          >
                            <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-lg hover:bg-background transition-colors flex items-center justify-center text-foreground"><Minus size={14} /></button>
                            <span className="font-black text-sm text-foreground">{qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 flex items-center justify-center shadow-md"><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Persistent Floating Checkout Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 sm:bottom-8 left-4 right-4 z-[500] animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-md mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4">
            
            {/* Cart Button with Badge */}
            <button 
              onClick={() => setShowCart(true)}
              className="relative w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center shrink-0 active:scale-95"
            >
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 dark:bg-amber-400 text-white dark:text-zinc-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md font-mono tabular-nums">
                {totalItems}
              </span>
            </button>

            {/* Total Price Column */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">Total</p>
              <p className="text-lg font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 truncate leading-none">
                {formatRupiah(cart.reduce((s, i) => s + i.price * i.qty, 0))}
              </p>
            </div>
            
            {/* Primary Action Button */}
            <Button 
              onClick={() => {
                const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
                const total = subtotal + Math.round(subtotal * 0.11);
                setCheckoutTotal(total);
              }}
              className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 h-12 px-6 font-black shadow-md shadow-amber-500/20 dark:shadow-amber-400/5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Pesan Sekarang</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer 
          cart={cart} 
          onChangeQty={changeQty} 
          onClose={() => setShowCart(false)} 
          onCheckout={(total) => { setShowCart(false); setCheckoutTotal(total); }} 
        />
      )}

      {/* Member Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-muted">
            <div className="p-6 border-b flex justify-between items-center bg-primary/5">
              <h3 className="text-xl font-black flex items-center gap-2">
                <User className="text-primary" /> {loginMode === 'login' ? 'Member Login' : 'Daftar Member'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowLogin(false)} className="rounded-lg hover:bg-rose-500/10 hover:text-rose-500">
                <X size={20} />
              </Button>
            </div>
            
            {/* Tabs Selector */}
            <div className="grid grid-cols-2 border-b text-center text-xs font-black uppercase tracking-wider">
              <button 
                onClick={() => setLoginMode('login')} 
                className={`py-3 transition-colors ${loginMode === 'login' ? 'border-b-2 border-amber-500 text-amber-600 font-black' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}`}
              >
                Masuk
              </button>
              <button 
                onClick={() => setLoginMode('register')} 
                className={`py-3 transition-colors ${loginMode === 'register' ? 'border-b-2 border-amber-500 text-amber-600 font-black' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}`}
              >
                Daftar Baru
              </button>
            </div>

            {loginMode === 'login' ? (
              <form onSubmit={handleMemberLogin} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nomor HP</label>
                  <Input 
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="0812xxxxxx"
                    className="rounded-lg h-12 bg-background font-mono"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loginLoading}
                  className="w-full h-12 font-black rounded-lg mt-4 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  {loginLoading ? 'Memproses...' : 'Masuk Sekarang'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMemberRegister} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nama Lengkap</label>
                  <Input 
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Contoh: Rina Amelia"
                    className="rounded-lg h-12 bg-background font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nomor HP / WhatsApp</label>
                  <Input 
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0812xxxxxx"
                    className="rounded-lg h-12 bg-background font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Email (Opsional)</label>
                  <Input 
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="rina@example.com"
                    className="rounded-lg h-12 bg-background"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loginLoading}
                  className="w-full h-12 font-black rounded-lg mt-4 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  {loginLoading ? 'Memproses...' : 'Daftar & Masuk'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
      {customizingItem && (
        <Suspense fallback={<ModalLoader />}>
          <GuestCustomizerModal
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
        </Suspense>
      )}
    </div>
  );
}
